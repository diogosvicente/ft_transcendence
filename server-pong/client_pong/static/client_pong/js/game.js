(() => {
  document.addEventListener("DOMContentLoaded", () => {

    const currentPath = window.location.pathname;
    if (!currentPath.includes("/pong/game/")) {
      return;
    }

    console.log("[DEBUG] Página de jogo detectada. Iniciando polling...");


    // Função de polling para aguardar que os elementos essenciais existam no DOM
    function waitForElements() {
      const loadingEl = document.getElementById("game-loading");
      const contentEl = document.getElementById("game-content");

      if (!loadingEl || !contentEl) {
        setTimeout(waitForElements, 200);
        return;
      }

      initGame(loadingEl, contentEl);
    }

    // Função principal do jogo, chamada após os elementos existirem
    function initGame(loadingEl, contentEl) {

      // Função utilitária para construir a URL do WebSocket
      function getWsUrl(endpoint) {
        const loc = window.location;
        let newUri = loc.protocol === "https:" ? "wss:" : "ws:";
        newUri += "//" + loc.host + endpoint;
        return newUri;
      }

      const API_BASE_URL = "http://127.0.0.1:8000";
      console.log("[DEBUG] API_BASE_URL:", API_BASE_URL);

      const defaultAvatar = `${API_BASE_URL}/media/avatars/default.png`;

      // Seleção dos elementos do DOM
      const elements = {
        loading: loadingEl,
        error: document.getElementById("game-error"),
        content: contentEl,
        player1Avatar: document.getElementById("player1-avatar"),
        player1Name: document.getElementById("player1-name"),
        player1You: document.getElementById("player1-you"),
        player2Avatar: document.getElementById("player2-avatar"),
        player2Name: document.getElementById("player2-name"),
        player2You: document.getElementById("player2-you"),
        pauseButton: document.getElementById("pause-button"),
        gameOverMessage: document.getElementById("game-over-message"),
        mobileControlUp: document.getElementById("mobile-control-up"),
        mobileControlDown: document.getElementById("mobile-control-down"),
        pausedOverlay: document.getElementById("paused-overlay"),
        countdownOverlay: document.getElementById("countdown-overlay")
      };

      // Variáveis de estado
      let gameInstance = null;
      let socket = null;
      let assignedSide = null;
      let countdown = null;
      let pendingState = null;
      let isPaused = false;
      let moveInterval = null;

      console.log("[DEBUG] Elements:", elements);

      // Função que define o core do jogo: renderização do canvas
      const gameCore = (canvas) => {
        const ctx = canvas.getContext("2d");

        const clearCanvas = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        };

        const renderState = (state) => {
          if (!state || !state.ball || !state.paddles || !state.scores) {
            console.error("[DEBUG] Estado inválido:", state);
            return;
          }

          const { ball, paddles, scores } = state;

          // Limpa e desenha o fundo
          clearCanvas();
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Linha central tracejada
          ctx.strokeStyle = "white";
          ctx.setLineDash([10, 10]);
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2, 0);
          ctx.lineTo(canvas.width / 2, canvas.height);
          ctx.stroke();

          // Placar
          ctx.fillStyle = "white";
          ctx.font = "24px Arial";
          ctx.textAlign = "center";
          ctx.fillText(`${scores.left} - ${scores.right}`, canvas.width / 2, 30);

          // Paddles
          ctx.fillStyle = "white";
          ctx.fillRect(10, paddles.left || 0, 10, 100);
          ctx.fillRect(canvas.width - 20, paddles.right || 0, 10, 100);

          // Bola
          ctx.beginPath();
          ctx.arc(ball.x || canvas.width / 2, ball.y || canvas.height / 2, 10, 0, Math.PI * 2);
          ctx.fillStyle = "white";
          ctx.fill();
        };

        return { renderState, clearCanvas };
      };

      // Função para renderizar informações dos jogadores
      function renderPlayersInfo(matchData, isPlayer1) {

        if (elements.player1Avatar) {
          elements.player1Avatar.src = matchData.player1_avatar
            ? `${API_BASE_URL}${matchData.player1_avatar}`
            : defaultAvatar;
        }
        if (elements.player1Name) {
          elements.player1Name.textContent = matchData.player1_display || "Unknown Player";
        }
        if (isPlayer1 && elements.player1You) {
          elements.player1You.classList.remove("d-none");
        }

        if (elements.player2Avatar) {
          elements.player2Avatar.src = matchData.player2_avatar
            ? `${API_BASE_URL}${matchData.player2_avatar}`
            : defaultAvatar;
        }
        if (elements.player2Name) {
          elements.player2Name.textContent = matchData.player2_display || "Unknown Player";
        }
        if (!isPlayer1 && elements.player2You) {
          elements.player2You.classList.remove("d-none");
        }
      }

      // Função para exibir mensagens de erro
      function showError(message) {
        console.warn("[DEBUG] showError():", message);
        if (elements.error) {
          elements.error.textContent = message;
          elements.error.classList.remove("d-none");
        }
        if (elements.content) {
          elements.content.classList.add("d-none");
        }
        if (elements.loading) {
          elements.loading.classList.add("d-none");
        }
      }

      // Função para buscar dados da partida via API
      async function fetchMatchData(matchId) {
        try {
          const accessToken = localStorage.getItem("access");

          const response = await fetch(`${API_BASE_URL}/api/game/match/${matchId}/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!response.ok) throw new Error("Failed to fetch match data");
          const data = await response.json();
          return data;
        } catch (error) {
          console.error("[DEBUG] Erro no fetch:", error.message);
          showError(error.message || "Error loading match data");
          return null;
        }
      }

      // Funções de controle para mobile e desktop
      function handlePressStart(directionKey, event) {
        event.preventDefault();
        if (!assignedSide || !socket || socket.readyState !== WebSocket.OPEN) return;
        if (moveInterval) return;
        moveInterval = setInterval(() => {
          socket.send(JSON.stringify({
            type: "player_move",
            direction: directionKey === "w" ? "up" : "down"
          }));
        }, 100);
      }

      function handlePressEnd() {
        if (moveInterval) {
          clearInterval(moveInterval);
          moveInterval = null;
        }
      }

      function handleKeyDown(e) {
        if (!assignedSide || !socket || socket.readyState !== WebSocket.OPEN) return;
        if (["w", "s"].includes(e.key)) {
          socket.send(JSON.stringify({
            type: "player_move",
            direction: e.key === "w" ? "up" : "down"
          }));
        }
      }
      window.addEventListener("keydown", handleKeyDown);

      function togglePause() {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: isPaused ? "resume_game" : "pause_game"
          }));
        }
      }
      if (elements.pauseButton) {
        elements.pauseButton.addEventListener("click", togglePause);
      }

      if (elements.mobileControlUp) {
        elements.mobileControlUp.addEventListener("mousedown", (e) => handlePressStart("w", e));
        elements.mobileControlUp.addEventListener("touchstart", (e) => handlePressStart("w", e));
        elements.mobileControlUp.addEventListener("mouseup", handlePressEnd);
        elements.mobileControlUp.addEventListener("touchend", handlePressEnd);
      }
      if (elements.mobileControlDown) {
        elements.mobileControlDown.addEventListener("mousedown", (e) => handlePressStart("s", e));
        elements.mobileControlDown.addEventListener("touchstart", (e) => handlePressStart("s", e));
        elements.mobileControlDown.addEventListener("mouseup", handlePressEnd);
        elements.mobileControlDown.addEventListener("touchend", handlePressEnd);
      }

      // Extrai o matchId a partir da URL (último segmento)
      const path = window.location.pathname;
      const matchId = path.split("/").pop();
      if (!matchId) {
        showError("Match ID not found in the URL.");
        return;
      }

      // Inicia o fluxo: busca os dados da partida, renderiza informações e configura o WebSocket
      fetchMatchData(matchId).then(matchData => {
        if (!matchData) {
          console.warn("[DEBUG] matchData está nulo. Interrompendo fluxo.");
          return;
        }

        const loggedUserId = parseInt(localStorage.getItem("id"), 10);
        const isPlayer1 = matchData.player1_id === loggedUserId;

        renderPlayersInfo(matchData, isPlayer1);

        if (elements.loading) {
          elements.loading.classList.add("d-none");
          console.log("[DEBUG] Ocultou loading");
        }
        if (elements.content) {
          elements.content.classList.remove("d-none");
          console.log("[DEBUG] Exibiu conteúdo do jogo");
        }

        const accessToken = localStorage.getItem("access");
        const wsUrl = `ws://${window.location.host}/ws/game/${matchId}/?access_token=${accessToken}`;

        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          const canvas = document.getElementById("pongCanvas");

          if (canvas && !gameInstance) {
            gameInstance = gameCore(canvas);

            if (pendingState) {
              gameInstance.renderState(pendingState);
              pendingState = null;
            }
          }
        };

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "assigned_side":
              assignedSide = data.side;
              break;
            case "countdown":
              countdown = data.state?.message || null;
              if (elements.countdownOverlay) {
                elements.countdownOverlay.textContent = countdown;
                elements.countdownOverlay.style.display = countdown ? "block" : "none";
              }
              break;
            case "wo_countdown":
              countdown = data.state?.countdown || null;
              if (elements.countdownOverlay) {
                elements.countdownOverlay.textContent = countdown;
                elements.countdownOverlay.style.display = countdown ? "block" : "none";
              }
              break;
            case "game_start":
              countdown = null;
              if (elements.countdownOverlay) {
                elements.countdownOverlay.style.display = "none";
              }
              break;
            case "paused":
              isPaused = true;
              if (elements.pausedOverlay) {
                elements.pausedOverlay.style.display = "block";
              }
              break;
            case "resumed":
              isPaused = false;
              if (elements.pausedOverlay) {
                elements.pausedOverlay.style.display = "none";
              }
              if (pendingState && gameInstance) {
                gameInstance.renderState(pendingState);
                pendingState = null;
              }
              break;
            case "state_update":
              if (gameInstance) {
                gameInstance.renderState(data.state);
              } else {
                pendingState = data.state;
              }
              break;
            case "walkover":
              alert(data.state.message);
              data.state.redirect_url = "/pong/chat";
              window.location.href = data.state.redirect_url;
              break;
            case "match_finished":
              const currentUserId = localStorage.getItem("id");
              const finalAlertMessage = data.state.final_alert[currentUserId] || "";
              if (window.confirm(finalAlertMessage)) {
                data.state.redirect_url = "/pong/chat";
                window.location.href = data.state.redirect_url;
              }
              break;
            default:
              console.warn("[DEBUG] Unknown message:", data);
          }
        };

        socket.onclose = () => {
          console.warn("[DEBUG] WebSocket disconnected.");
        };

        socket.onerror = (error) => {
          console.error("[DEBUG] WebSocket error:", error);
        };
      });
    }

    // Inicia o polling para aguardar que #game-loading e #game-content existam
    waitForElements();
  });
})();

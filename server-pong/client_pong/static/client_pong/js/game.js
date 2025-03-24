(() => {
  document.addEventListener("DOMContentLoaded", () => {
    // Função utilitária para construir a URL do WebSocket
    function getWsUrl(endpoint) {
      const loc = window.location;
      let newUri = loc.protocol === "https:" ? "wss:" : "ws:";
      newUri += "//" + loc.host + endpoint;
      return newUri;
    }

    // Constantes e seleção de elementos do DOM
    const defaultAvatar = `${API_BASE_URL}/media/avatars/default.png`;

    const elements = {
      loading: document.getElementById("game-loading"),
      error: document.getElementById("game-error"),
      content: document.getElementById("game-content"),
      player1Avatar: document.getElementById("player1-avatar"),
      player1Name: document.getElementById("player1-name"),
      player1You: document.getElementById("player1-you"),
      player2Avatar: document.getElementById("player2-avatar"),
      player2Name: document.getElementById("player2-name"),
      player2You: document.getElementById("player2-you"),
      pauseButton: document.getElementById("pause-button"),
      gameOverMessage: document.getElementById("game-over-message"),
      // Elementos opcionais para controles mobile e overlays:
      mobileControlUp: document.getElementById("mobile-control-up"),
      mobileControlDown: document.getElementById("mobile-control-down"),
      pausedOverlay: document.getElementById("paused-overlay"),
      countdownOverlay: document.getElementById("countdown-overlay")
    };

    // Variáveis de estado
    let gameInstance = null; // Referência para o jogo (semelhante ao gameRef)
    let socket = null;
    let assignedSide = null;
    let countdown = null;
    let pendingState = null;
    let isPaused = false;
    let moveInterval = null;

    // Renderiza as informações dos jogadores na tela
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

    // Exibe mensagens de erro e oculta o conteúdo principal
    function showError(message) {
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

    // Busca dados do match a partir da API (usando fetch)
    async function fetchMatchData(matchId) {
      try {
        const accessToken = localStorage.getItem("access");
        const response = await fetch(`${API_BASE_URL}/api/game/match/${matchId}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error("Failed to fetch match data");
        return await response.json();
      } catch (error) {
        console.error(error.message);
        showError(error.message || "Error loading match data");
        return null;
      }
    }

    // Controles mobile: envia comando de movimento repetidamente enquanto o botão estiver pressionado
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

    // Controles desktop: envia comando ao pressionar as teclas "w" ou "s"
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

    // Alterna o estado de pausa enviando comando via WebSocket
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

    // Configura os eventos para controles mobile, se os elementos existirem
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

    // Extrai o matchId a partir da URL (supondo que seja o último segmento da URL)
    const path = window.location.pathname;
    const matchId = path.split("/").pop();
    if (!matchId) {
      showError("Match ID not found in the URL.");
      return;
    }

    // Inicia o fluxo: busca os dados do match, renderiza as informações e configura o WebSocket
    fetchMatchData(matchId).then(matchData => {
      if (!matchData) return;
      // Verifica se o usuário logado é o player1
      const loggedUserId = parseInt(localStorage.getItem("id"), 10);
      const isPlayer1 = matchData.player1_id === loggedUserId;

      // Renderiza as informações dos jogadores
      renderPlayersInfo(matchData, isPlayer1);

      // Oculta a mensagem de loading e exibe o conteúdo
      if (elements.loading) elements.loading.classList.add("d-none");
      if (elements.content) elements.content.classList.remove("d-none");

      // Configura o WebSocket
      const accessToken = localStorage.getItem("access");
      const wsUrl = `${getWsUrl(`/ws/game/${matchId}/`)}?access_token=${accessToken}`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("WebSocket connected.");
        const canvas = document.getElementById("pongCanvas");
        if (canvas && !gameInstance) {
          // Inicializa o jogo usando a função gameCore (deve estar definida globalmente)
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
            window.location.href = data.state.redirect_url;
            break;
          case "match_finished":
            const currentUserId = localStorage.getItem("id");
            const finalAlertMessage = data.state.final_alert[currentUserId] || "";
            if (window.confirm(finalAlertMessage)) {
              window.location.href = data.state.redirect_url;
            }
            break;
          default:
            console.warn("Unknown message:", data);
        }
      };

      socket.onclose = () => {
        console.warn("WebSocket disconnected.");
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    });
  });
})();

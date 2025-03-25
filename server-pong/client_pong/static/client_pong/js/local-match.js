(() => {
  function waitForElements() {
    const singleBtn = document.getElementById("single-match-btn");
    const tournBtn = document.getElementById("tournament-btn");
    const singleContainer = document.getElementById("single-match-container");
    const tournContainer = document.getElementById("tournament-container");
    const pauseContainer = document.getElementById("pause-container");
    const pauseBtn = document.getElementById("pauseBtn");
    const backHomeBtn = document.getElementById("backHomeBtn");
    const singleOverlay = document.getElementById("single-overlay-start");
    const tournOverlay = document.getElementById("tournament-overlay-start");

    // Verifica se todos existem
    if (
      !singleBtn ||
      !tournBtn ||
      !singleContainer ||
      !tournContainer ||
      !pauseContainer ||
      !pauseBtn ||
      !backHomeBtn ||
      !singleOverlay ||
      !tournOverlay
    ) {
      setTimeout(waitForElements, 200);
      return;
    }
    console.log("[DEBUG] Todos os elementos encontrados. Iniciando initAll()...");
    initAll();
  }

  function initAll() {
    // Constantes do paddle
    const PADDLE_HEIGHT = 50;
    const PADDLE_THICKNESS = 5;

    function drawPaddle(ctx, x, y) {
      ctx.fillStyle = "white";
      ctx.fillRect(x, y, PADDLE_THICKNESS, PADDLE_HEIGHT);
    }

    class GameCore {
      constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.leftPlayerName = options.leftPlayerName || "PLAYER1";
        this.rightPlayerName = options.rightPlayerName || "PLAYER2";
        this.onMatchEnd = options.onMatchEnd || null;

        this.BALL_SIZE = 5;
        this.ballX = 300;
        this.ballY = 300;
        this.ballSpeedX = 150;
        this.ballSpeedY = 150;

        this.leftPaddleY = this.canvas.height / 2 - PADDLE_HEIGHT / 2;
        this.rightPaddleY = this.canvas.height / 2 - PADDLE_HEIGHT / 2;

        this.player1Score = 0;
        this.player2Score = 0;
        this.WINNING_SCORE = 5;

        this.prevTime = undefined;
        this.animationId = null;
        this.gameActive = false;

        // Flags de tecla
        this.qPressed = false;
        this.aPressed = false;
        this.upPressed = false;
        this.downPressed = false;

        // Bind
        this.keyDownHandler = this.keyDownHandler.bind(this);
        this.keyUpHandler = this.keyUpHandler.bind(this);

        this.paused = true;
      }

      reset() {
        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height / 2;
        this.ballSpeedX = 150;
        this.ballSpeedY = 150;
        this.player1Score = 0;
        this.player2Score = 0;
      }

      start() {
        this.reset();
        window.addEventListener("keydown", this.keyDownHandler, { passive: false });
        window.addEventListener("keyup", this.keyUpHandler, { passive: false });
        this.gameActive = true;
        this.animationId = requestAnimationFrame((t) => this.mainLoop(t));
      }

      stop() {
        if (this.animationId) {
          cancelAnimationFrame(this.animationId);
          this.animationId = null;
        }
        window.removeEventListener("keydown", this.keyDownHandler);
        window.removeEventListener("keyup", this.keyUpHandler);
      }

      keyDownHandler(e) {
        if (e.code === "KeyW") this.qPressed = true;
        if (e.code === "KeyS") this.aPressed = true;
        if (e.code === "ArrowUp") {
          this.upPressed = true;
          e.preventDefault();
        }
        if (e.code === "ArrowDown") {
          this.downPressed = true;
          e.preventDefault();
        }
      }

      keyUpHandler(e) {
        if (e.code === "KeyW") this.qPressed = false;
        if (e.code === "KeyS") this.aPressed = false;
        if (e.code === "ArrowUp") this.upPressed = false;
        if (e.code === "ArrowDown") this.downPressed = false;
      }

      mainLoop(currTime) {
        if (!this.gameActive) return;
        this.animationId = requestAnimationFrame((t) => this.mainLoop(t));
        if (this.prevTime === undefined) {
          this.prevTime = currTime;
        }
        const deltaTime = currTime - this.prevTime;
        if (!this.paused) {
          this.update(deltaTime);
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.draw(this.ctx);
        }
        this.prevTime = currTime;
      }

      update(deltaTime) {
        this.ballX += (this.ballSpeedX * deltaTime) / 1000;
        this.ballY += (this.ballSpeedY * deltaTime) / 1000;

        // Movimentação dos paddles
        if (this.qPressed) this.leftPaddleY -= 2;
        if (this.aPressed) this.leftPaddleY += 2;
        if (this.upPressed) this.rightPaddleY -= 2;
        if (this.downPressed) this.rightPaddleY += 2;

        // Limites
        if (this.leftPaddleY < 0) this.leftPaddleY = 0;
        if (this.leftPaddleY + PADDLE_HEIGHT > this.canvas.height) {
          this.leftPaddleY = this.canvas.height - PADDLE_HEIGHT;
        }
        if (this.rightPaddleY < 0) this.rightPaddleY = 0;
        if (this.rightPaddleY + PADDLE_HEIGHT > this.canvas.height) {
          this.rightPaddleY = this.canvas.height - PADDLE_HEIGHT;
        }

        // Parede direita
        if (this.ballX + this.BALL_SIZE >= this.canvas.width) {
          if (this.ballY > this.rightPaddleY && this.ballY < this.rightPaddleY + PADDLE_HEIGHT) {
            this.ballX -= (this.ballSpeedX * deltaTime) / 1000;
            this.ballSpeedX = -this.ballSpeedX;
            let deltaY = this.ballY - (this.rightPaddleY + PADDLE_HEIGHT / 2);
            this.ballSpeedY = deltaY * 4;
          } else {
            this.player1Score++;
            this.checkWinner();
          }
        }

        // Parede esquerda
        if (this.ballX <= 0) {
          if (this.ballY > this.leftPaddleY && this.ballY < this.leftPaddleY + PADDLE_HEIGHT) {
            this.ballX -= (this.ballSpeedX * deltaTime) / 1000;
            this.ballSpeedX = -this.ballSpeedX;
            let deltaY = this.ballY - (this.leftPaddleY + PADDLE_HEIGHT / 2);
            this.ballSpeedY = deltaY * 4;
          } else {
            this.player2Score++;
            this.checkWinner();
          }
        }

        // Topo/fundo
        if (this.ballY + this.BALL_SIZE > this.canvas.height && this.ballSpeedY > 0) {
          this.ballSpeedY = -this.ballSpeedY;
        }
        if (this.ballY < 0 && this.ballSpeedY < 0) {
          this.ballSpeedY = -this.ballSpeedY;
        }
      }

      checkWinner() {
        if (this.player1Score >= this.WINNING_SCORE) {
          if (this.onMatchEnd) this.onMatchEnd(this.leftPlayerName);
          return;
        }
        if (this.player2Score >= this.WINNING_SCORE) {
          if (this.onMatchEnd) this.onMatchEnd(this.rightPlayerName);
          return;
        }
        // Reposiciona a bola
        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height / 2;
        this.ballSpeedX = -this.ballSpeedX;
        this.ballSpeedY = 100;
      }

      draw(ctx) {
        ctx.save();
        // Fundo
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Linha central
        ctx.beginPath();
        ctx.setLineDash([5, 15]);
        ctx.moveTo(this.canvas.width / 2, 0);
        ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // Bola
        ctx.fillStyle = "white";
        ctx.fillRect(this.ballX, this.ballY, this.BALL_SIZE, this.BALL_SIZE);

        // Paddles
        drawPaddle(ctx, 0, this.leftPaddleY);
        drawPaddle(ctx, this.canvas.width - PADDLE_THICKNESS, this.rightPaddleY);

        // Placar
        ctx.fillStyle = "white";
        ctx.font = "10px Arial";
        ctx.fillText(this.player1Score, 50, 30);
        ctx.fillText(this.player2Score, this.canvas.width - 70, 30);

        ctx.restore();
      }
    }

    class ExtendedPongGame {
      constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        this.gameCore = new GameCore(this.canvas, {
          leftPlayerName: config.leftPlayerName,
          rightPlayerName: config.rightPlayerName,
          onMatchEnd: config.onMatchEnd,
        });
      }
      start() {
        this.gameCore.start();
      }
      stop() {
        this.gameCore.stop();
      }
      setPaused(paused) {
        this.gameCore.paused = paused;
      }
      isPaused() {
        return this.gameCore.paused;
      }
    }

    const LocalMatchManager = {
      singleGame: null,
      tournamentGame: null,
      currentMatch: 1,
      winnerMatch1: null,
      winnerMatch2: null,
      champion: null,

      init() {
        console.log("[LocalMatch] init()");

        const singleBtn = document.getElementById("single-match-btn");
        const tournBtn = document.getElementById("tournament-btn");
        const backHomeBtn = document.getElementById("backHomeBtn");
        const pauseBtn = document.getElementById("pauseBtn");

        // Botão "Voltar"
        if (backHomeBtn) {
          backHomeBtn.addEventListener("click", () => {
            window.location.href = "/pong";
          });
        }

        // Botões de modo
        if (singleBtn) {
          singleBtn.addEventListener("click", () => {
            this.startSingleMatch();
          });
        }
        if (tournBtn) {
          tournBtn.addEventListener("click", () => {
            this.startTournament();
          });
        }

        // Botão de pausa
        if (pauseBtn) {
          pauseBtn.addEventListener("click", () => {
            if (this.singleGame) {
              const current = this.singleGame.isPaused();
              this.singleGame.setPaused(!current);
            } else if (this.tournamentGame) {
              const current = this.tournamentGame.isPaused();
              this.tournamentGame.setPaused(!current);
            }
          });
        }

        // Tecla espaço
        window.addEventListener("keydown", (e) => {
          if (e.code === "Space") {
            e.preventDefault();
            if (this.singleGame) {
              const current = this.singleGame.isPaused();
              this.singleGame.setPaused(!current);
            } else if (this.tournamentGame) {
              const current = this.tournamentGame.isPaused();
              this.tournamentGame.setPaused(!current);
            }
          }
        });
      },

      // PARTIDA SIMPLES
      startSingleMatch() {
        console.log("[LocalMatch] startSingleMatch()");
        const pauseContainer = document.getElementById("pause-container");
        if (pauseContainer) pauseContainer.classList.remove("d-none");

        // Se houver torneio
        if (this.tournamentGame) {
          this.tournamentGame.stop();
          this.tournamentGame = null;
        }
        this.resetTournamentState();

        const singleContainer = document.getElementById("single-match-container");
        const tournContainer = document.getElementById("tournament-container");
        if (singleContainer) singleContainer.classList.remove("d-none");
        if (tournContainer) tournContainer.classList.add("d-none");

        if (this.singleGame) {
          this.singleGame.stop();
          this.singleGame = null;
        }

        // Overlay de iniciar
        const singleOverlay = document.getElementById("single-overlay-start");
        if (singleOverlay) singleOverlay.classList.remove("d-none");

        const singleGameOver = document.getElementById("single-game-over");
        if (singleGameOver) {
          singleGameOver.innerHTML = "";
          singleGameOver.classList.add("d-none");
        }

        this.singleGame = new ExtendedPongGame("single-canvas", {
          leftPlayerName: "PLAYER1",
          rightPlayerName: "PLAYER2",
          targetScore: 5,
          onMatchEnd: (winnerName) => {
            // Finaliza
            this.singleGame.stop();
            const pauseContainer = document.getElementById("pause-container");
            if (pauseContainer) pauseContainer.classList.add("d-none");

            // Mensagem de vencedor
            if (singleGameOver) {
              singleGameOver.innerHTML = `<h3>${winnerName} venceu!</h3>`;
              singleGameOver.classList.remove("d-none");
            }

            // Oculta container
            if (singleContainer) {
              singleContainer.classList.add("d-none");
            }
          },
        });
        this.singleGame.start();
        this.singleGame.setPaused(true);

        // Botão "Iniciar Partida"
        const singleStartBtn = document.getElementById("single-start-btn");
        if (singleStartBtn) {
          singleStartBtn.onclick = () => {
            if (singleOverlay) singleOverlay.classList.add("d-none");
            this.singleGame.setPaused(false);
          };
        }

        // Controles mobile do single
        const singleMobileControls = document.getElementById("single-mobile-controls");
        if (singleMobileControls) {
          const buttons = singleMobileControls.querySelectorAll("button");
          buttons.forEach((btn) => {
            const key = btn.dataset.key; // ex. "KeyW", "KeyS", "ArrowUp", "ArrowDown"
            btn.addEventListener("mousedown", (e) => {
              e.preventDefault();
              this.setKeyDownSingle(key);
            });
            btn.addEventListener("touchstart", (e) => {
              e.preventDefault();
              this.setKeyDownSingle(key);
            });
            btn.addEventListener("mouseup", (e) => {
              e.preventDefault();
              this.setKeyUpSingle(key);
            });
            btn.addEventListener("touchend", (e) => {
              e.preventDefault();
              this.setKeyUpSingle(key);
            });
          });
        }
      },

      // Métodos para simular pressionamento de tecla no single
      setKeyDownSingle(key) {
        if (!this.singleGame) return;
        const gc = this.singleGame.gameCore;
        if (key === "KeyW") gc.qPressed = true;
        if (key === "KeyS") gc.aPressed = true;
        if (key === "ArrowUp") gc.upPressed = true;
        if (key === "ArrowDown") gc.downPressed = true;
      },
      setKeyUpSingle(key) {
        if (!this.singleGame) return;
        const gc = this.singleGame.gameCore;
        if (key === "KeyW") gc.qPressed = false;
        if (key === "KeyS") gc.aPressed = false;
        if (key === "ArrowUp") gc.upPressed = false;
        if (key === "ArrowDown") gc.downPressed = false;
      },

      // TORNEIO
      startTournament() {
        console.log("[LocalMatch] startTournament()");
        const pauseContainer = document.getElementById("pause-container");
        if (pauseContainer) pauseContainer.classList.remove("d-none");

        if (this.singleGame) {
          this.singleGame.stop();
          this.singleGame = null;
        }

        const singleContainer = document.getElementById("single-match-container");
        const tournContainer = document.getElementById("tournament-container");
        if (singleContainer) singleContainer.classList.add("d-none");
        if (tournContainer) {
          tournContainer.classList.remove("d-none");
          const tournCanvas = document.getElementById("tournament-canvas");
          if (tournCanvas) tournCanvas.classList.remove("d-none");
        }

        this.resetTournamentState();
        this.playMatch1();
      },

      resetTournamentState() {
        this.currentMatch = 1;
        this.winnerMatch1 = null;
        this.winnerMatch2 = null;
        this.champion = null;

        const w1El = document.getElementById("winner-match1");
        const w2El = document.getElementById("winner-match2");
        const championSpan = document.getElementById("champion-span");
        const finalLeft = document.getElementById("final-match-left");
        const finalRight = document.getElementById("final-match-right");
        if (w1El) w1El.textContent = "Vencedor: ?";
        if (w2El) w2El.textContent = "Vencedor: ?";
        if (championSpan) championSpan.textContent = "Vencedor: ?";
        if (finalLeft) finalLeft.textContent = "?";
        if (finalRight) finalRight.textContent = "?";

        const tournGameOver = document.getElementById("tournament-game-over");
        if (tournGameOver) {
          tournGameOver.innerHTML = "";
          tournGameOver.classList.add("d-none");
        }

        if (this.tournamentGame) {
          this.tournamentGame.stop();
          this.tournamentGame = null;
        }
      },

      highlightCurrentMatch(matchNumber) {
        const allMatches = document.querySelectorAll(".round1 .match, .round2 .match, .round3 .match");
        allMatches.forEach(m => m.classList.remove("current"));
        if (matchNumber === 1) {
          const round1Match = document.querySelector(".round1 .match");
          if (round1Match) round1Match.classList.add("current");
        } else if (matchNumber === 2) {
          const round2Match = document.querySelector(".round2 .match");
          if (round2Match) round2Match.classList.add("current");
        } else if (matchNumber === 3) {
          const round3Match = document.querySelector(".round3 .match");
          if (round3Match) round3Match.classList.add("current");
        }
      },

      playMatch1() {
        console.log("[Tournament] Partida #1 iniciada");
        this.currentMatch = 1;
        this.highlightCurrentMatch(1);

        if (this.tournamentGame) this.tournamentGame.stop();

        const tournOverlay = document.getElementById("tournament-overlay-start");
        if (tournOverlay) tournOverlay.classList.remove("d-none");
        const tournStartBtn = document.getElementById("tournament-start-btn");

        this.tournamentGame = new ExtendedPongGame("tournament-canvas", {
          leftPlayerName: "PLAYER1",
          rightPlayerName: "PLAYER2",
          targetScore: 5,
          onMatchEnd: (winnerName) => {
            console.log("[Tournament] Match1 ended. Winner:", winnerName);
            this.tournamentGame.stop();
            this.tournamentGame = null;
            this.winnerMatch1 = winnerName;
            const w1El = document.getElementById("winner-match1");
            if (w1El) w1El.textContent = "Vencedor: " + winnerName;
            this.playMatch2();
          },
        });
        this.tournamentGame.start();
        this.tournamentGame.setPaused(true);

        // Controles mobile do torneio
        this.attachTournamentMobileControls();

        if (tournStartBtn) {
          tournStartBtn.onclick = () => {
            tournOverlay.classList.add("d-none");
            this.tournamentGame.setPaused(false);
          };
        }
      },

      playMatch2() {
        console.log("[Tournament] Partida #2 iniciada");
        this.currentMatch = 2;
        this.highlightCurrentMatch(2);

        if (this.tournamentGame) this.tournamentGame.stop();

        const tournOverlay = document.getElementById("tournament-overlay-start");
        if (tournOverlay) tournOverlay.classList.remove("d-none");
        const tournStartBtn = document.getElementById("tournament-start-btn");

        this.tournamentGame = new ExtendedPongGame("tournament-canvas", {
          leftPlayerName: "PLAYER3",
          rightPlayerName: "PLAYER4",
          targetScore: 5,
          onMatchEnd: (winnerName) => {
            console.log("[Tournament] Match2 ended. Winner:", winnerName);
            this.tournamentGame.stop();
            this.tournamentGame = null;
            this.winnerMatch2 = winnerName;
            const w2El = document.getElementById("winner-match2");
            if (w2El) w2El.textContent = "Vencedor: " + winnerName;
            this.playFinal();
          },
        });
        this.tournamentGame.start();
        this.tournamentGame.setPaused(true);
        this.attachTournamentMobileControls();

        if (tournStartBtn) {
          tournStartBtn.onclick = () => {
            tournOverlay.classList.add("d-none");
            this.tournamentGame.setPaused(false);
          };
        }
      },

      playFinal() {
        console.log("[Tournament] Final iniciada");
        this.currentMatch = 3;
        this.highlightCurrentMatch(3);

        if (this.tournamentGame) this.tournamentGame.stop();

        const finalLeft = document.getElementById("final-match-left");
        const finalRight = document.getElementById("final-match-right");
        if (finalLeft) finalLeft.textContent = this.winnerMatch1 || "?";
        if (finalRight) finalRight.textContent = this.winnerMatch2 || "?";

        const tournOverlay = document.getElementById("tournament-overlay-start");
        if (tournOverlay) tournOverlay.classList.remove("d-none");
        const tournStartBtn = document.getElementById("tournament-start-btn");

        this.tournamentGame = new ExtendedPongGame("tournament-canvas", {
          leftPlayerName: this.winnerMatch1 || "Vencedor M1",
          rightPlayerName: this.winnerMatch2 || "Vencedor M2",
          targetScore: 5,
          onMatchEnd: (winnerName) => {
            console.log("[Tournament] Final acabou. Campeão:", winnerName);
            this.champion = winnerName;
            this.tournamentGame.stop();
            this.tournamentGame = null;

            const pauseContainer = document.getElementById("pause-container");
            if (pauseContainer) pauseContainer.classList.add("d-none");

            const championSpan = document.getElementById("champion-span");
            if (championSpan) championSpan.textContent = "Vencedor: " + winnerName;

            const tournGameOver = document.getElementById("tournament-game-over");
            if (tournGameOver) {
              tournGameOver.innerHTML = `<h3>Campeão: ${winnerName} 🎉</h3>`;
              tournGameOver.classList.remove("d-none");
            }

            // Oculta o canvas do torneio
            const tournCanvas = document.getElementById("tournament-canvas");
            if (tournCanvas) tournCanvas.classList.add("d-none");
            const tournScore = document.querySelectorAll(".score-board")[1];
            if (tournScore) tournScore.classList.add("d-none");
          },
        });
        this.tournamentGame.start();
        this.tournamentGame.setPaused(true);
        this.attachTournamentMobileControls();

        if (tournStartBtn) {
          tournStartBtn.onclick = () => {
            tournOverlay.classList.add("d-none");
            this.tournamentGame.setPaused(false);
          };
        }
      },

      /* Métodos para simular pressionamento de tecla no torneio */
      attachTournamentMobileControls() {
        const tournamentMobileControls = document.getElementById("tournament-mobile-controls");
        if (!tournamentMobileControls || !this.tournamentGame) return;
        const gc = this.tournamentGame.gameCore;

        // Remove eventListeners antigos se quiser, mas aqui é simples
        const buttons = tournamentMobileControls.querySelectorAll("button");
        buttons.forEach((btn) => {
          const key = btn.dataset.key;

          btn.onmousedown = (e) => {
            e.preventDefault();
            this.setKeyDownTournament(key);
          };
          btn.ontouchstart = (e) => {
            e.preventDefault();
            this.setKeyDownTournament(key);
          };
          btn.onmouseup = (e) => {
            e.preventDefault();
            this.setKeyUpTournament(key);
          };
          btn.ontouchend = (e) => {
            e.preventDefault();
            this.setKeyUpTournament(key);
          };
        });
      },
      setKeyDownTournament(key) {
        if (!this.tournamentGame) return;
        const gc = this.tournamentGame.gameCore;
        if (key === "KeyW") gc.qPressed = true;
        if (key === "KeyS") gc.aPressed = true;
        if (key === "ArrowUp") gc.upPressed = true;
        if (key === "ArrowDown") gc.downPressed = true;
      },
      setKeyUpTournament(key) {
        if (!this.tournamentGame) return;
        const gc = this.tournamentGame.gameCore;
        if (key === "KeyW") gc.qPressed = false;
        if (key === "KeyS") gc.aPressed = false;
        if (key === "ArrowUp") gc.upPressed = false;
        if (key === "ArrowDown") gc.downPressed = false;
      },
    };

    window.LocalMatchManager = LocalMatchManager;
    LocalMatchManager.init();
  }

  document.addEventListener("DOMContentLoaded", () => {
    waitForElements();
  });
})();

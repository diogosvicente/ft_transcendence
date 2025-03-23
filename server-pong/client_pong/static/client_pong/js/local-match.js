// static/client_pong/js/local_match.js
(() => {
  if (window.PongGame) return;

  class PongGame {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.gameActive = false;

      // Configurações do jogo
      this.config = {
        paddleWidth: 10,
        paddleHeight: 80,
        ballSize: 8,
        paddleSpeed: 5,
        ballSpeed: 3,
        targetScore: 5,
      };

      // Estado do jogo
      this.gameState = {
        player1Y: this.canvas.height / 2 - this.config.paddleHeight / 2,
        player2Y: this.canvas.height / 2 - this.config.paddleHeight / 2,
        ballX: this.canvas.width / 2,
        ballY: this.canvas.height / 2,
        ballDX: this.config.ballSpeed,
        ballDY: this.config.ballSpeed,
        score1: 0,
        score2: 0,
        paused: false,
      };

      this.keys = {};

      // Vincula as funções para poder removê-las depois
      this.boundHandleKeyDown = this.handleKeyDown.bind(this);
      this.boundHandleKeyUp = this.handleKeyUp.bind(this);

      this.init();
    }

    init() {
      // Event listeners de teclado
      document.addEventListener('keydown', this.boundHandleKeyDown);
      document.addEventListener('keyup', this.boundHandleKeyUp);

      // Botão de pause (só adiciona o listener se existir no DOM)
      const pauseBtn = document.getElementById('pauseBtn');
      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
          this.gameState.paused = !this.gameState.paused;
        });
      }

      this.gameActive = true;
      this.gameLoop();
    }

    handleKeyDown(e) {
      this.keys[e.key] = true;
    }

    handleKeyUp(e) {
      this.keys[e.key] = false;
    }

    update() {
      if (this.gameState.paused || !this.gameActive) return;

      // Movimento das raquetes
      if (this.keys['w']) this.gameState.player1Y -= this.config.paddleSpeed;
      if (this.keys['s']) this.gameState.player1Y += this.config.paddleSpeed;
      if (this.keys['ArrowUp']) this.gameState.player2Y -= this.config.paddleSpeed;
      if (this.keys['ArrowDown']) this.gameState.player2Y += this.config.paddleSpeed;

      // Limites das raquetes
      this.gameState.player1Y = Math.max(
        0,
        Math.min(this.canvas.height - this.config.paddleHeight, this.gameState.player1Y)
      );
      this.gameState.player2Y = Math.max(
        0,
        Math.min(this.canvas.height - this.config.paddleHeight, this.gameState.player2Y)
      );

      // Movimento da bola
      this.gameState.ballX += this.gameState.ballDX;
      this.gameState.ballY += this.gameState.ballDY;

      // Colisões com as paredes
      if (
        (this.gameState.ballY <= 0 && this.gameState.ballDY < 0) ||
        (this.gameState.ballY >= this.canvas.height && this.gameState.ballDY > 0)
      ) {
        this.gameState.ballDY *= -1;
      }

      // Colisões com as raquetes
      this.checkPaddleCollision();

      // Pontuação
      if (this.gameState.ballX <= 0) {
        this.gameState.score2++;
        this.resetBall();
      }
      if (this.gameState.ballX >= this.canvas.width) {
        this.gameState.score1++;
        this.resetBall();
      }

      // Verifica se alguém atingiu a pontuação alvo
      if (this.gameState.score1 >= this.config.targetScore) {
        this.gameOver('Jogador 1');
      } else if (this.gameState.score2 >= this.config.targetScore) {
        this.gameOver('Jogador 2');
      }

      // Atualiza placar se os elementos existirem
      const p1ScoreEl = document.getElementById('player1-score');
      if (p1ScoreEl) {
        p1ScoreEl.textContent = this.gameState.score1;
      }
      const p2ScoreEl = document.getElementById('player2-score');
      if (p2ScoreEl) {
        p2ScoreEl.textContent = this.gameState.score2;
      }
    }

    gameOver(winner) {
      this.gameActive = false;
      this.showGameOverMessage(`${winner} venceu! 🎉`);

      // Botão de reinício
      const restartBtn = document.createElement('button');
      restartBtn.textContent = 'Jogar Novamente';
      restartBtn.className = 'btn btn-primary mt-3';
      restartBtn.onclick = () => {
        this.destroy();
        window.cleanupLocalMatch();
        window.initLocalMatch();
        const gameOverDiv = document.getElementById('game-over-message');
        if (gameOverDiv) {
          gameOverDiv.classList.add('d-none');
        }
      };

      const gameOverDiv = document.getElementById('game-over-message');
      if (gameOverDiv) {
        gameOverDiv.appendChild(restartBtn);
      }
    }

    showGameOverMessage(message) {
      const gameOverDiv = document.getElementById('game-over-message');
      if (gameOverDiv) {
        gameOverDiv.innerHTML = `<h3 class="text-center">${message}</h3>`;
        gameOverDiv.classList.remove('d-none');
      }
    }

    checkPaddleCollision() {
      const paddleWidth = this.config.paddleWidth;
      const paddleHeight = this.config.paddleHeight;
      const ballSize = this.config.ballSize;
      const maxBounceAngle = Math.PI / 3; // 60 graus

      // Verifica colisão em uma raquete específica
      const checkPaddle = (paddleY, isLeftPaddle) => {
        const verticalCollision =
          this.gameState.ballY + ballSize >= paddleY &&
          this.gameState.ballY - ballSize <= paddleY + paddleHeight;

        const horizontalCollision = isLeftPaddle
          ? this.gameState.ballX - ballSize <= paddleWidth
          : this.gameState.ballX + ballSize >= this.canvas.width - paddleWidth;

        if (verticalCollision && horizontalCollision) {
          const paddleCenter = paddleY + paddleHeight / 2;
          const relativeIntersectY = paddleCenter - this.gameState.ballY;
          const normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);
          const bounceAngle = normalizedIntersectY * maxBounceAngle;
          const direction = isLeftPaddle ? 1 : -1;

          // Mantém a magnitude da velocidade
          const speed = Math.sqrt(this.gameState.ballDX ** 2 + this.gameState.ballDY ** 2);
          this.gameState.ballDX = direction * speed * Math.cos(bounceAngle);
          this.gameState.ballDY = -speed * Math.sin(bounceAngle);
        }
      };

      checkPaddle(this.gameState.player1Y, true);
      checkPaddle(this.gameState.player2Y, false);
    }

    resetBall() {
      this.gameState.ballX = this.canvas.width / 2;
      this.gameState.ballY = this.canvas.height / 2;
      this.gameState.ballDX = this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
      this.gameState.ballDY = this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    }

    draw() {
      // Limpa canvas
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Desenha raquetes
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(
        0,
        this.gameState.player1Y,
        this.config.paddleWidth,
        this.config.paddleHeight
      );
      this.ctx.fillRect(
        this.canvas.width - this.config.paddleWidth,
        this.gameState.player2Y,
        this.config.paddleWidth,
        this.config.paddleHeight
      );

      // Desenha bola
      this.ctx.beginPath();
      this.ctx.arc(
        this.gameState.ballX,
        this.gameState.ballY,
        this.config.ballSize,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }

    gameLoop() {
      if (!this.gameActive) return;
      this.update();
      this.draw();
      requestAnimationFrame(() => this.gameLoop());
    }

    destroy() {
      // Para o jogo e limpa o canvas
      this.gameActive = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Remove os event listeners de teclado
      document.removeEventListener('keydown', this.boundHandleKeyDown);
      document.removeEventListener('keyup', this.boundHandleKeyUp);

      // Reseta o placar se os elementos existirem
      const p1ScoreEl = document.getElementById('player1-score');
      if (p1ScoreEl) p1ScoreEl.textContent = '0';
      const p2ScoreEl = document.getElementById('player2-score');
      if (p2ScoreEl) p2ScoreEl.textContent = '0';
    }
  }

  window.PongGame = PongGame;

  // Função que inicializa o jogo local
  window.initLocalMatch = function() {
    window.cleanupLocalMatch();
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      // “Deixe como estava antes”: não adiciona placar ou botão extra aqui
      gameContainer.innerHTML = `
        <canvas id="pongCanvas" width="800" height="400"></canvas>
        <div id="game-over-message" class="d-none text-center"></div>
      `;
    }
    window.pongInstance = new PongGame('pongCanvas');
  };

  // Função de cleanup que destrói a instância e limpa o container
  window.cleanupLocalMatch = function() {
    if (window.pongInstance) {
      window.pongInstance.destroy();
      window.pongInstance = null;
    }
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.innerHTML = '';
    }
  };
})();

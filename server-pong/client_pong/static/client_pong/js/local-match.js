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
        paddleHeight: 100,
        ballSize: 8,
        paddleSpeed: 5,
        ballSpeed: 3
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
        paused: false
      };

      this.keys = {};
      this.init();
    }

    init() {
      // Event listeners
      document.addEventListener('keydown', (e) => this.handleKeyDown(e));
      document.addEventListener('keyup', (e) => this.handleKeyUp(e));

      // Botão de pause
      document.getElementById('pauseBtn').addEventListener('click', () => {
        this.gameState.paused = !this.gameState.paused;
      });

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
      if (this.gameState.paused) return;

      // Movimento das raquetes
      if (this.keys['w']) this.gameState.player1Y -= this.config.paddleSpeed;
      if (this.keys['s']) this.gameState.player1Y += this.config.paddleSpeed;
      if (this.keys['ArrowUp']) this.gameState.player2Y -= this.config.paddleSpeed;
      if (this.keys['ArrowDown']) this.gameState.player2Y += this.config.paddleSpeed;

      // Limites das raquetes
      this.gameState.player1Y = Math.max(0,
        Math.min(this.canvas.height - this.config.paddleHeight, this.gameState.player1Y));
      this.gameState.player2Y = Math.max(0,
        Math.min(this.canvas.height - this.config.paddleHeight, this.gameState.player2Y));

      // Movimento da bola
      this.gameState.ballX += this.gameState.ballDX;
      this.gameState.ballY += this.gameState.ballDY;

      // Colisões com as paredes
      if ((this.gameState.ballY <= 0 && this.gameState.ballDY < 0) ||
        (this.gameState.ballY >= this.canvas.height && this.gameState.ballDY > 0)) {
        this.gameState.ballDY *= -1;
      }

      // Colisões com as raquetes
      this.checkPaddleCollision()

      // Pontuação
      if (this.gameState.ballX <= 0) {
        this.gameState.score2++;
        this.resetBall();
      }
      if (this.gameState.ballX >= this.canvas.width) {
        this.gameState.score1++;
        this.resetBall();
      }

      // Atualizar placar
      document.getElementById('player1-score').textContent = this.gameState.score1;
      document.getElementById('player2-score').textContent = this.gameState.score2;
    }

    checkPaddleCollision() {
      const paddleWidth = this.config.paddleWidth;
      const paddleHeight = this.config.paddleHeight;
      const ballSize = this.config.ballSize;
      const maxBounceAngle = Math.PI / 3; // 60 graus máximo
      let collision = false;

      // Função para verificar colisão em uma raquete específica
      const checkPaddle = (paddleY, isLeftPaddle) => {
        // Verifica colisão vertical (considerando o tamanho da bola)
        const verticalCollision = this.gameState.ballY + ballSize >= paddleY &&
          this.gameState.ballY - ballSize <= paddleY + paddleHeight;

        // Verifica colisão horizontal
        const horizontalCollision = isLeftPaddle
          ? this.gameState.ballX - ballSize <= paddleWidth
          : this.gameState.ballX + ballSize >= this.canvas.width - paddleWidth;

        if (verticalCollision && horizontalCollision) {
          // Calcula ponto de impacto relativo (-1 a 1)
          const paddleCenter = paddleY + paddleHeight / 2;
          const relativeIntersectY = paddleCenter - this.gameState.ballY;
          const normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);

          // Calcula o ângulo de rebate
          const bounceAngle = normalizedIntersectY * maxBounceAngle;

          // Determina direção horizontal
          const direction = isLeftPaddle ? 1 : -1;

          // Ajusta velocidade mantendo a magnitude
          const speed = Math.sqrt(this.gameState.ballDX ** 2 + this.gameState.ballDY ** 2);
          this.gameState.ballDX = direction * speed * Math.cos(bounceAngle);
          this.gameState.ballDY = -speed * Math.sin(bounceAngle);

          collision = true;
        }
      };

      // Verifica ambas as raquetes
      checkPaddle(this.gameState.player1Y, true);
      checkPaddle(this.gameState.player2Y, false);

      return collision;
    }

    resetBall() {
      this.gameState.ballX = this.canvas.width / 2;
      this.gameState.ballY = this.canvas.height / 2;
      this.gameState.ballDX = this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
      this.gameState.ballDY = this.config.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    }

    draw() {
      // Limpar canvas
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Desenhar elementos
      this.ctx.fillStyle = '#fff';

      // Raquetes
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

      // Bola
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
      this.gameActive = false;
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('keyup', this.handleKeyUp);
    }
  }

  window.PongGame = PongGame;

  // Inicialização integrada com o SPA
  window.initLocalMatch = function() {
    if (!window.pongInstance) {
      window.pongInstance = new PongGame('pongCanvas');
    }
  };

  // Limpeza ao sair da página
  window.cleanupLocalMatch = function() {
    if (!window.pongInstance) {
      window.pongGame.destroy();
      window.pongGame = null;
    }
  };
})();

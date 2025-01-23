export const gameCore = (canvas, sendState) => {
  const ctx = canvas.getContext("2d");

  // Variáveis de controle
  let ballX = canvas.width / 2;
  let ballY = canvas.height / 2;
  let ballSpeedX = 0; // Velocidade inicial é zero até a contagem regressiva
  let ballSpeedY = 0;

  const PADDLE_HEIGHT = 100;
  const PADDLE_THICKNESS = 10;

  let leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
  let rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;

  const PLAYER_SPEED = 5;

  let scorePlayer1 = 0;
  let scorePlayer2 = 0;

  let playerSide = "left"; // Controle padrão
  let isPaused = false;

  const setPlayerSide = (side) => {
    playerSide = side;
    console.log(`Jogador configurado no lado: ${side}`);
  };

  const startWithDirection = (direction) => {
    ballSpeedX = direction.x;
    ballSpeedY = direction.y;
    isPaused = false;
    gameLoop();
  };

  const start = () => {
    window.addEventListener("keydown", keyDownHandler);
    requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    if (isPaused) return;

    update();
    draw(ctx);

    // Envia o estado do paddle para o servidor
    if (typeof sendState === "function") {
      sendState({
        ballX,
        ballY,
        leftPaddleY,
        rightPaddleY,
      });
    }

    requestAnimationFrame(gameLoop);
  };

  const update = () => {
    // Movimenta a bola
    ballX += ballSpeedX / 60;
    ballY += ballSpeedY / 60;

    // Colisão com as bordas
    if (ballY <= 0 || ballY >= canvas.height) {
      ballSpeedY = -ballSpeedY;
    }

    // Colisão com o paddle esquerdo
    if (
      ballX <= PADDLE_THICKNESS &&
      ballY >= leftPaddleY &&
      ballY <= leftPaddleY + PADDLE_HEIGHT
    ) {
      ballSpeedX = -ballSpeedX;
      const deltaY = ballY - (leftPaddleY + PADDLE_HEIGHT / 2);
      ballSpeedY = deltaY * 2;
    }

    // Colisão com o paddle direito
    if (
      ballX >= canvas.width - PADDLE_THICKNESS &&
      ballY >= rightPaddleY &&
      ballY <= rightPaddleY + PADDLE_HEIGHT
    ) {
      ballSpeedX = -ballSpeedX;
      const deltaY = ballY - (rightPaddleY + PADDLE_HEIGHT / 2);
      ballSpeedY = deltaY * 2;
    }

    // Pontuação para jogador 1 (esquerda)
    if (ballX > canvas.width) {
      scorePlayer1 += 1;
      resetBall();
    }

    // Pontuação para jogador 2 (direita)
    if (ballX < 0) {
      scorePlayer2 += 1;
      resetBall();
    }
  };

  const draw = (ctx) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fundo do jogo
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // Linha Central
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
  
    // Placar
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${scorePlayer1} - ${scorePlayer2}`, canvas.width / 2, 50);
  
    // Paddles e Bola
    ctx.setLineDash([]);
    ctx.fillStyle = "white";
    ctx.fillRect(0, leftPaddleY, PADDLE_THICKNESS, PADDLE_HEIGHT);
    ctx.fillRect(canvas.width - PADDLE_THICKNESS, rightPaddleY, PADDLE_THICKNESS, PADDLE_HEIGHT);
    ctx.fillRect(ballX - 5, ballY - 5, 10, 10); // Corrige a posição da bola
  };

  const resetBall = () => {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX;
    ballSpeedY = 300 * (Math.random() > 0.5 ? 1 : -1); // Direção aleatória
    // isPaused = true;
    setTimeout(() => (isPaused = false), 1000); // Pausa de 1 segundo antes de recomeçar
  };

  const syncState = (state) => {
    ballX = state.ballX;
    ballY = state.ballY;
    leftPaddleY = state.leftPaddleY;
    rightPaddleY = state.rightPaddleY;
  };

  const updatePaddlePosition = (paddle, position) => {
    if (paddle === "left") {
      leftPaddleY = position;
    } else if (paddle === "right") {
      rightPaddleY = position;
    }
  };

  const keyDownHandler = (e) => {
    if (playerSide === "left") {
      if (e.key === "w" && leftPaddleY > 0) leftPaddleY -= PLAYER_SPEED;
      if (e.key === "s" && leftPaddleY < canvas.height - PADDLE_HEIGHT)
        leftPaddleY += PLAYER_SPEED;
    } else if (playerSide === "right") {
      if (e.key === "w" && rightPaddleY > 0) rightPaddleY -= PLAYER_SPEED;
      if (
        e.key === "s" &&
        rightPaddleY < canvas.height - PADDLE_HEIGHT
      )
        rightPaddleY += PLAYER_SPEED;
    }
  };

  return { start, startWithDirection, syncState, setPlayerSide, updatePaddlePosition };
};
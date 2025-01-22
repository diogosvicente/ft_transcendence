export const gameCore = (canvas, sendState) => {
  const ctx = canvas.getContext("2d");

  // Variáveis de controle
  let ballX = canvas.width / 2;
  let ballY = canvas.height / 2;
  let ballSpeedX = 300;
  let ballSpeedY = 300;

  const PADDLE_HEIGHT = 100;
  const PADDLE_THICKNESS = 10;

  let leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
  let rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;

  const PLAYER_SPEED = 5;

  let playerSide = "left"; // Controle padrão (será configurado pelo lado atribuído)
  let opponentPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;

  let isPaused = false;

  const setPlayerSide = (side) => {
    playerSide = side;
    console.log(`Jogador configurado no lado: ${side}`);
  };

  const start = () => {
    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);
    requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    if (isPaused) return;

    update();
    draw(ctx);

    // Envia o estado do jogo para o servidor
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
      resetBall();
    }

    // Pontuação para jogador 2 (direita)
    if (ballX < 0) {
      resetBall();
    }
  };

  const draw = (ctx) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha a bola
    ctx.fillStyle = "white";
    ctx.fillRect(ballX, ballY, 10, 10);

    // Desenha os paddles
    ctx.fillStyle = "white";
    ctx.fillRect(0, leftPaddleY, PADDLE_THICKNESS, PADDLE_HEIGHT);
    ctx.fillRect(
      canvas.width - PADDLE_THICKNESS,
      rightPaddleY,
      PADDLE_THICKNESS,
      PADDLE_HEIGHT
    );
  };

  const resetBall = () => {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX;
    ballSpeedY = 300;
  };

  const syncState = (state) => {
    ballX = state.ballX;
    ballY = state.ballY;
    leftPaddleY = state.leftPaddleY;
    rightPaddleY = state.rightPaddleY;
  };

  const keyDownHandler = (e) => {
    if (playerSide === "left") {
      if (e.key === "w" && leftPaddleY > 0) leftPaddleY -= PLAYER_SPEED;
      if (e.key === "s" && leftPaddleY < canvas.height - PADDLE_HEIGHT)
        leftPaddleY += PLAYER_SPEED;
    } else if (playerSide === "right") {
      if (e.key === "ArrowUp" && rightPaddleY > 0) rightPaddleY -= PLAYER_SPEED;
      if (
        e.key === "ArrowDown" &&
        rightPaddleY < canvas.height - PADDLE_HEIGHT
      )
        rightPaddleY += PLAYER_SPEED;
    }
  };

  const keyUpHandler = () => {
    // Não necessário para o movimento contínuo
  };

  return { start, syncState, setPlayerSide };
};

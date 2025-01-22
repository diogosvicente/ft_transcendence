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
  
    let player1Score = 0;
    let player2Score = 0;
  
    const WINNING_SCORE = 3;
  
    // Variáveis de movimento
    let wPressed = false;
    let sPressed = false;
    let upPressed = false;
    let downPressed = false;
  
    // Estado do jogo
    let isPaused = false;
  
    // Função principal para iniciar o jogo
    const start = () => {
      window.addEventListener("keydown", keyDownHandler, false);
      window.addEventListener("keyup", keyUpHandler, false);
      requestAnimationFrame(mainLoop);
    };
  
    // Loop principal do jogo
    const mainLoop = (currTime) => {
      if (isPaused) return;
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw(ctx);
  
      update();
  
      // Envia o estado atualizado para os jogadores
      sendState({
        ballX,
        ballY,
        leftPaddleY,
        rightPaddleY,
        player1Score,
        player2Score,
      });
  
      requestAnimationFrame(mainLoop);
    };
  
    // Lógica de atualização do estado
    const update = () => {
      // Movimenta a bola
      ballX += ballSpeedX / 60;
      ballY += ballSpeedY / 60;
  
      // Verifica colisão com as bordas superior e inferior
      if (ballY <= 0 || ballY >= canvas.height) {
        ballSpeedY = -ballSpeedY;
      }
  
      // Colisão com o lado direito (barra do player 2)
      if (
        ballX + 10 >= canvas.width - PADDLE_THICKNESS &&
        ballY >= rightPaddleY &&
        ballY <= rightPaddleY + PADDLE_HEIGHT
      ) {
        ballSpeedX = -ballSpeedX;
        const deltaY = ballY - (rightPaddleY + PADDLE_HEIGHT / 2);
        ballSpeedY = deltaY * 2;
      }
  
      // Colisão com o lado esquerdo (barra do player 1)
      if (
        ballX <= PADDLE_THICKNESS &&
        ballY >= leftPaddleY &&
        ballY <= leftPaddleY + PADDLE_HEIGHT
      ) {
        ballSpeedX = -ballSpeedX;
        const deltaY = ballY - (leftPaddleY + PADDLE_HEIGHT / 2);
        ballSpeedY = deltaY * 2;
      }
  
      // Pontuação do player 1
      if (ballX > canvas.width) {
        player1Score++;
        checkWinner();
        resetBall();
      }
  
      // Pontuação do player 2
      if (ballX < 0) {
        player2Score++;
        checkWinner();
        resetBall();
      }
  
      // Movimento das barras
      if (wPressed && leftPaddleY > 0) leftPaddleY -= 5;
      if (sPressed && leftPaddleY < canvas.height - PADDLE_HEIGHT)
        leftPaddleY += 5;
      if (upPressed && rightPaddleY > 0) rightPaddleY -= 5;
      if (downPressed && rightPaddleY < canvas.height - PADDLE_HEIGHT)
        rightPaddleY += 5;
    };
  
    // Verifica se algum jogador atingiu a pontuação vencedora
    const checkWinner = () => {
      if (player1Score >= WINNING_SCORE || player2Score >= WINNING_SCORE) {
        isPaused = true;
        const winner = player1Score >= WINNING_SCORE ? "Jogador 1" : "Jogador 2";
        alert(`${winner} venceu!`);
        resetGame();
      }
    };
  
    // Função para redesenhar a tela
    const draw = (ctx) => {
      // Fundo
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // Bola
      ctx.fillStyle = "white";
      ctx.fillRect(ballX, ballY, 10, 10);
  
      // Barras
      ctx.fillRect(0, leftPaddleY, PADDLE_THICKNESS, PADDLE_HEIGHT);
      ctx.fillRect(
        canvas.width - PADDLE_THICKNESS,
        rightPaddleY,
        PADDLE_THICKNESS,
        PADDLE_HEIGHT
      );
  
      // Placar
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(player1Score, canvas.width / 4, 50);
      ctx.fillText(player2Score, (3 * canvas.width) / 4, 50);
    };
  
    // Sincroniza o estado recebido do WebSocket
    const syncState = (state) => {
      ballX = state.ballX;
      ballY = state.ballY;
      leftPaddleY = state.leftPaddleY;
      rightPaddleY = state.rightPaddleY;
      player1Score = state.player1Score;
      player2Score = state.player2Score;
    };
  
    // Reinicia a posição da bola
    const resetBall = () => {
      ballX = canvas.width / 2;
      ballY = canvas.height / 2;
      ballSpeedX = -ballSpeedX; // Alterna a direção horizontal
      ballSpeedY = 300;
    };
  
    // Reinicia o jogo
    const resetGame = () => {
      player1Score = 0;
      player2Score = 0;
      resetBall();
      isPaused = false;
    };
  
    // Handlers de teclado
    const keyDownHandler = (e) => {
      if (e.key === "w") wPressed = true;
      if (e.key === "s") sPressed = true;
      if (e.key === "ArrowUp") upPressed = true;
      if (e.key === "ArrowDown") downPressed = true;
    };
  
    const keyUpHandler = (e) => {
      if (e.key === "w") wPressed = false;
      if (e.key === "s") sPressed = false;
      if (e.key === "ArrowUp") upPressed = false;
      if (e.key === "ArrowDown") downPressed = false;
    };
  
    return {
      start,
      syncState,
    };
  };
  
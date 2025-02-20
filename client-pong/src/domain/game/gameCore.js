// client-pong/src/domain/game/gameCore.js
import { drawPaddle, PADDLE_HEIGHT, PADDLE_THICKNESS } from "./paddle.js";

let ballX = 300;
let ballY = 300;

// Speed target in pixels/second
let ballSpeedX = 300;
let ballSpeedY = 300;

// Left player controls
let qPressed = false;
let aPressed = false;

// Right player controls
let upPressed = false;
let downPressed = false;

let player1Score = 0;
let player2Score = 0;

const WINNING_SCORE = 5;

export const gameCore = function (canvas, options = {}) {
  const ctx = canvas.getContext("2d");

  let leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
  let rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;

  let prevTime;
  let animationId = null; // Armazena o ID do requestAnimationFrame

  const mainLoop = (currTime) => {
    animationId = requestAnimationFrame(mainLoop);

    if (prevTime === undefined) {
      prevTime = currTime;
    }
    const deltaTime = currTime - prevTime;

    update(deltaTime);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw(ctx);

    prevTime = currTime;
  };

  const start = () => {
    // Zera o placar ao iniciar
    player1Score = 0;
    player2Score = 0;

    window.addEventListener("keydown", keyDownHandler, false);
    window.addEventListener("keyup", keyUpHandler, false);

    animationId = requestAnimationFrame(mainLoop);
  };

  /**
   * Para o jogo: remove listeners e cancela o requestAnimationFrame
   */
  const stop = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    window.removeEventListener("keydown", keyDownHandler);
    window.removeEventListener("keyup", keyUpHandler);
  };

  const calcDistToMove = (speed, deltaTime) => {
    return (speed * deltaTime) / 1000;
  };

  const update = (deltaTime) => {
    // Ball MOVEMENT
    ballX += calcDistToMove(ballSpeedX, deltaTime);
    ballY += calcDistToMove(ballSpeedY, deltaTime);

    // Left Paddle MOVEMENT
    if (qPressed) leftPaddleY -= 5;
    if (aPressed) leftPaddleY += 5;

    // Right Paddle MOVEMENT
    if (upPressed) rightPaddleY -= 5;
    if (downPressed) rightPaddleY += 5;

    // COLLISION for PADDLES - lado direito
    if (ballX + 20 >= canvas.width) {
      if (ballY > rightPaddleY && ballY < rightPaddleY + PADDLE_HEIGHT) {
        ballX -= calcDistToMove(ballSpeedX, deltaTime);
        ballSpeedX = -ballSpeedX;
        let deltaY = ballY - (rightPaddleY + PADDLE_HEIGHT / 2);
        ballSpeedY = deltaY * 4;
      } else {
        player1Score++;
        ballReset();
      }
    }

    // COLLISION for PADDLES - lado esquerdo
    if (ballX <= 0) {
      if (ballY > leftPaddleY && ballY < leftPaddleY + PADDLE_HEIGHT) {
        ballX -= calcDistToMove(ballSpeedX, deltaTime);
        ballSpeedX = -ballSpeedX;
        let deltaY = ballY - (leftPaddleY + PADDLE_HEIGHT / 2);
        ballSpeedY = deltaY * 4;
      } else {
        player2Score++;
        ballReset();
      }
    }

    // COLLISION for vertical boundaries
    if (ballY + 20 > canvas.height) {
      ballSpeedY = -ballSpeedY;
    }
    if (ballY < 0) {
      ballSpeedY = -ballSpeedY;
    }
  };

  const draw = (ctx) => {
    ctx.save();

    // Field
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ball
    ctx.fillStyle = "white";
    ctx.fillRect(ballX, ballY, 20, 20);

    // Left paddle
    drawPaddle(ctx, 0, leftPaddleY);

    // Right paddle
    drawPaddle(ctx, canvas.width - PADDLE_THICKNESS, rightPaddleY);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(player1Score, 100, 50);
    ctx.fillText(player2Score, canvas.width - 100, 50);

    ctx.restore();
  };

  const ballReset = () => {
    // Se alguém chegou a 5 pontos, avisa e para
    if (player1Score >= WINNING_SCORE) {
      if (options.onMatchEnd) {
        options.onMatchEnd("PLAYER1");
      }
      return;
    }
    if (player2Score >= WINNING_SCORE) {
      if (options.onMatchEnd) {
        options.onMatchEnd("PLAYER2");
      }
      return;
    }

    // Caso contrário, apenas reposiciona a bola
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;

    ballSpeedX = -ballSpeedX;
    ballSpeedY = 300;
  };

  // Captura de teclas
  function keyDownHandler(e) {
    // Impede a rolagem da página
    if (e.code === "ArrowUp" || e.code === "ArrowDown") {
      e.preventDefault();
    }

    if (e.code === "ArrowUp") upPressed = true;
    if (e.code === "ArrowDown") downPressed = true;
    if (e.code === "KeyW") qPressed = true;
    if (e.code === "KeyS") aPressed = true;
  }

  function keyUpHandler(e) {
    if (e.code === "ArrowUp") upPressed = false;
    if (e.code === "ArrowDown") downPressed = false;
    if (e.code === "KeyW") qPressed = false;
    if (e.code === "KeyS") aPressed = false;
  }

  return {
    start,
    stop,
  };
};

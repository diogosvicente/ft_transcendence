// client-pong/src/domain/game/gameCore.js
import { drawPaddle, PADDLE_HEIGHT, PADDLE_THICKNESS } from "./paddle.js";

const BALL_SIZE = 10;        // Bola menor
let ballX = 300;
let ballY = 300;
let ballSpeedX = 300;
let ballSpeedY = 300;

let qPressed = false;
let aPressed = false;
let upPressed = false;
let downPressed = false;

let player1Score = 0;
let player2Score = 0;

const WINNING_SCORE = 5;

export const gameCore = function (canvas, options = {}) {
  const {
    leftPlayerName = "PLAYER1",
    rightPlayerName = "PLAYER2",
    onMatchEnd,
  } = options;

  const ctx = canvas.getContext("2d");

  let leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
  let rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;

  let prevTime;
  let animationId = null;

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
    player1Score = 0;
    player2Score = 0;

    window.addEventListener("keydown", keyDownHandler, false);
    window.addEventListener("keyup", keyUpHandler, false);

    animationId = requestAnimationFrame(mainLoop);
  };

  const stop = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    window.removeEventListener("keydown", keyDownHandler);
    window.removeEventListener("keyup", keyUpHandler);
  };

  const update = (deltaTime) => {
    // Movimentação da bola
    ballX += (ballSpeedX * deltaTime) / 1000;
    ballY += (ballSpeedY * deltaTime) / 1000;

    // Movimentação dos paddles
    if (qPressed) leftPaddleY -= 5;
    if (aPressed) leftPaddleY += 5;

    if (upPressed) rightPaddleY -= 5;
    if (downPressed) rightPaddleY += 5;

    // Impedir que os paddles saiam da tela
    if (leftPaddleY < 0) leftPaddleY = 0;
    if (leftPaddleY + PADDLE_HEIGHT > canvas.height) {
      leftPaddleY = canvas.height - PADDLE_HEIGHT;
    }
    if (rightPaddleY < 0) rightPaddleY = 0;
    if (rightPaddleY + PADDLE_HEIGHT > canvas.height) {
      rightPaddleY = canvas.height - PADDLE_HEIGHT;
    }

    // Colisão com a parede direita
    if (ballX + BALL_SIZE >= canvas.width) {
      if (ballY > rightPaddleY && ballY < rightPaddleY + PADDLE_HEIGHT) {
        ballX -= (ballSpeedX * deltaTime) / 1000;
        ballSpeedX = -ballSpeedX;
        let deltaY = ballY - (rightPaddleY + PADDLE_HEIGHT / 2);
        ballSpeedY = deltaY * 4;
      } else {
        player1Score++;
        checkWinner();
      }
    }

    // Colisão com a parede esquerda
    if (ballX <= 0) {
      if (ballY > leftPaddleY && ballY < leftPaddleY + PADDLE_HEIGHT) {
        ballX -= (ballSpeedX * deltaTime) / 1000;
        ballSpeedX = -ballSpeedX;
        let deltaY = ballY - (leftPaddleY + PADDLE_HEIGHT / 2);
        ballSpeedY = deltaY * 4;
      } else {
        player2Score++;
        checkWinner();
      }
    }

    // Colisão com topo/fundo
    if (ballY + BALL_SIZE > canvas.height) {
      ballSpeedY = -ballSpeedY;
    }
    if (ballY < 0) {
      ballSpeedY = -ballSpeedY;
    }
  };

  const checkWinner = () => {
    if (player1Score >= WINNING_SCORE) {
      if (onMatchEnd) onMatchEnd(leftPlayerName);
      return;
    }
    if (player2Score >= WINNING_SCORE) {
      if (onMatchEnd) onMatchEnd(rightPlayerName);
      return;
    }
    // Se ninguém chegou a 5, reposiciona a bola
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX;
    ballSpeedY = 300;
  };

  const draw = (ctx) => {
    ctx.save();

    // Fundo
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Linha no meio (dashed)
    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Bola
    ctx.fillStyle = "white";
    ctx.fillRect(ballX, ballY, BALL_SIZE, BALL_SIZE);

    // Paddles
    drawPaddle(ctx, 0, leftPaddleY);
    drawPaddle(ctx, canvas.width - PADDLE_THICKNESS, rightPaddleY);

    // Placar maior
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    // Exemplo: placar no topo, um pouco maior
    ctx.fillText(player1Score, 100, 60);
    ctx.fillText(player2Score, canvas.width - 140, 60);

    ctx.restore();
  };

  function keyDownHandler(e) {
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

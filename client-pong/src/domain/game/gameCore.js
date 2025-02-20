// client-pong/src/domain/game/gameCore.js
import { drawPaddle, PADDLE_HEIGHT, PADDLE_THICKNESS } from "./paddle.js";

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
  // Desestruturamos as novas props:
  const {
    leftPlayerName = "PLAYER1",
    rightPlayerName = "PLAYER2",
    onMatchEnd, // callback opcional
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
    ballX += (ballSpeedX * deltaTime) / 1000;
    ballY += (ballSpeedY * deltaTime) / 1000;

    if (qPressed) leftPaddleY -= 5;
    if (aPressed) leftPaddleY += 5;

    if (upPressed) rightPaddleY -= 5;
    if (downPressed) rightPaddleY += 5;

    // Bate na parede direita
    if (ballX + 20 >= canvas.width) {
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

    // Bate na parede esquerda
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

    // Bate no topo/fundo
    if (ballY + 20 > canvas.height) {
      ballSpeedY = -ballSpeedY;
    }
    if (ballY < 0) {
      ballSpeedY = -ballSpeedY;
    }
  };

  const checkWinner = () => {
    if (player1Score >= WINNING_SCORE) {
      // Vencedor é o jogador da esquerda
      if (onMatchEnd) onMatchEnd(leftPlayerName);
      return; // Para de atualizar (não reseta a bola)
    }
    if (player2Score >= WINNING_SCORE) {
      // Vencedor é o jogador da direita
      if (onMatchEnd) onMatchEnd(rightPlayerName);
      return;
    }

    // Se ninguém chegou a 5 ainda, reposiciona a bola
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX;
    ballSpeedY = 300;
  };

  const draw = (ctx) => {
    ctx.save();

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.fillRect(ballX, ballY, 20, 20);

    drawPaddle(ctx, 0, leftPaddleY);
    drawPaddle(ctx, canvas.width - PADDLE_THICKNESS, rightPaddleY);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(player1Score, 100, 50);
    ctx.fillText(player2Score, canvas.width - 100, 50);

    ctx.restore();
  };

  function keyDownHandler(e) {
    // Evita scroll
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

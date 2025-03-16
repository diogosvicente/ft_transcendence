// client-pong/src/domain/game/gameCore.js
import { drawPaddle, PADDLE_HEIGHT, PADDLE_THICKNESS } from "./paddle.js";

const BALL_SIZE = 10;        // Bola menor
let ballX = 300;
let ballY = 300;
let ballSpeedX = 300;
let ballSpeedY = 300;

// Variáveis de controle (globais ao módulo)
let qPressed = false;   // W
let aPressed = false;   // S
let upPressed = false;  // ArrowUp
let downPressed = false; // ArrowDown

// Funções para alterar as variáveis globalmente (usadas no modo mobile)
export function setKeyDown(code) {
  if (code === "KeyW") qPressed = true;
  if (code === "KeyS") aPressed = true;
  if (code === "ArrowUp") upPressed = true;
  if (code === "ArrowDown") downPressed = true;
}

export function setKeyUp(code) {
  if (code === "KeyW") qPressed = false;
  if (code === "KeyS") aPressed = false;
  if (code === "ArrowUp") upPressed = false;
  if (code === "ArrowDown") downPressed = false;
}

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

  // Loop principal de animação
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

    // Adicionamos { passive: false } para poder chamar e.preventDefault() sem warning
    window.addEventListener("keydown", keyDownHandler, { passive: false });
    window.addEventListener("keyup", keyUpHandler, { passive: false });

    animationId = requestAnimationFrame(mainLoop);
  };

  const stop = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    // Removemos os listeners
    window.removeEventListener("keydown", keyDownHandler);
    window.removeEventListener("keyup", keyUpHandler);
  };

  // Atualiza estado do jogo
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
      // Se bater no paddle direito
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
      // Se bater no paddle esquerdo
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
    if (ballY + BALL_SIZE > canvas.height && ballSpeedY > 0) {
      ballSpeedY = -ballSpeedY;
    }
    if (ballY < 0 && ballSpeedY < 0) {
      ballSpeedY = -ballSpeedY;
    }
  };

  // Verifica se alguém ganhou
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

  // Desenha os elementos na tela
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
    ctx.fillText(player1Score, 100, 60);
    ctx.fillText(player2Score, canvas.width - 140, 60);

    ctx.restore();
  };

  // Handlers de teclado
  function keyDownHandler(e) {
    // Exemplo: prevenindo scroll em setas
    if (e.code === "ArrowUp" || e.code === "ArrowDown") {
      e.preventDefault(); // agora permitido pois passive=false
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

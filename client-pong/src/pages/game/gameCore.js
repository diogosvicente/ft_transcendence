import { drawPaddle, PADDLE_HEIGHT, PADDLE_THICKNESS } from "../../paddle.js";

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

const WINNING_SCORE = 3;

export const gameCore = function (canvas) {
  const ctx = canvas.getContext("2d");

  let leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
  let rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;

  let frameCount = 0;
  let fps;
  let prevTimeFpsMeasure;

  let prevTime;

  const mainLoop = function (currTime) {
    requestAnimationFrame(mainLoop);

    measureFps(currTime);

    // Calc delta time for time-based animation
    if (prevTime === undefined) {
      prevTime = currTime;
    }
    const deltaTime = currTime - prevTime;

    update(deltaTime);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw(ctx);

    prevTime = currTime;
  };

  const start = function () {
    window.addEventListener("keydown", keyDownHandler, false);
    window.addEventListener("keyup", keyUpHandler, false);

    requestAnimationFrame(mainLoop);
  };

  const calcDistToMove = function (deltaTime, speed) {
    return (speed * deltaTime) / 1000;
  };

  const update = function (deltaTime) {
    // Ball MOVEMENT
    ballX += calcDistToMove(ballSpeedX, deltaTime);
    ballY += calcDistToMove(ballSpeedY, deltaTime);

    // Left Paddle MOVEMENT
    if (qPressed) {
      leftPaddleY -= 5;
    }
    if (aPressed) {
      leftPaddleY += 5;
    }

    // Right Paddle MOVEMENT
    if (upPressed) {
      rightPaddleY -= 5;
    }
    if (downPressed) {
      rightPaddleY += 5;
    }

    // COLLISION for PADDLES
    if (ballX + 20 >= canvas.width) {
      if (ballY > rightPaddleY && ballY < rightPaddleY + PADDLE_HEIGHT) {
        ballX -= (ballSpeedX * deltaTime) / 1000;
        ballSpeedX = -ballSpeedX;

        let deltaY = ballY - (rightPaddleY + PADDLE_HEIGHT / 2);
        ballSpeedY = deltaY * 4; // Normalized deltaY
      } else {
        player1Score++;
        ballReset();
      }
    }
    if (ballX <= 0) {
      if (ballY > leftPaddleY && ballY < leftPaddleY + PADDLE_HEIGHT) {
        ballX -= (ballSpeedX * deltaTime) / 1000;
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

  const draw = function (ctx) {
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

    ctx.fillText(player1Score, 100, 100);
    ctx.fillText(player2Score, canvas.width - 100, 100);

    ctx.restore();
  };

  const measureFps = function (currTime) {
    if (prevTimeFpsMeasure === undefined) {
      prevTimeFpsMeasure = currTime;
    }

    const deltaTime = currTime - prevTimeFpsMeasure;
    if (deltaTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      prevTimeFpsMeasure = currTime;
    }
    frameCount++;
  };

  // NOTE: Disabled for now
  const handleAIMovement = function () {
    const rightPaddleCenter = rightPaddleY + PADDLE_HEIGHT / 2;
    if (ballSpeedX > 0) {
      if (ballY > rightPaddleCenter + 35) {
        rightPaddleY += 5;
      }
      if (ballY < rightPaddleCenter - 35) {
        rightPaddleY -= 5;
      }
    } else {
      if (rightPaddleCenter > canvas.height / 2) {
        rightPaddleY -= 5;
      }
      if (rightPaddleCenter < canvas.height / 2) {
        rightPaddleY += 5;
      }
    }
  };

  const ballReset = function () {
    if (player1Score >= WINNING_SCORE || player2Score >= WINNING_SCORE) {
      player1Score = 0;
      player2Score = 0;
    }

    ballX = canvas.width / 2;
    ballY = canvas.height / 2;

    ballSpeedX = -ballSpeedX;
    ballSpeedY = 300;
  };

  return {
    start: start,
  };
};

function keyDownHandler(e) {
  if (e.code === "ArrowUp") {
    upPressed = true;
  }
  if (e.code === "ArrowDown") {
    downPressed = true;
  }

  if (e.code === "KeyW") {
    qPressed = true;
  }
  if (e.code === "KeyS") {
    aPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.code === "ArrowUp") {
    upPressed = false;
  }
  if (e.code === "ArrowDown") {
    downPressed = false;
  }

  if (e.code === "KeyW") {
    qPressed = false;
  }
  if (e.code === "KeyS") {
    aPressed = false;
  }
}

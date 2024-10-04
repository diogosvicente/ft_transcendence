import { drawPaddle, PADDLE_HEIGHT, PADDLE_THICKNESS } from './paddle.js';

let ballX = 300;
let ballY = 300;

let ballSpeedX = 6;
let ballSpeedY = 3;

// Left player controls
let qPressed = false;
let aPressed = false;

// Right player controls
let upPressed = false;
let downPressed = false;

let player1Score = 0;
let player2Score = 0;

const WINNING_SCORE = 3;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

export function gameCore(canvas) {

    const ctx = canvas.getContext('2d');

    let leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    let rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;

    let animationFrameId;

    function start() {

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // ~60 updates/second
        const MS_PER_UPDATE = 16.67;

        let lastFrame;
        let lag = 0.0;

        // Immediately-Invoked Function Expression (IIFE)
        ; (() => {
            function main(tFrame) {
                animationFrameId = window.requestAnimationFrame(main);

                if (lastFrame === undefined) {
                    lastFrame = tFrame;
                }

                let dt = tFrame - lastFrame;
                lastFrame = tFrame;
                lag += dt;

                // Fixed update timestep, variable rendering
                while (lag >= MS_PER_UPDATE) {
                    update();
                    lag -= MS_PER_UPDATE;
                }
                //render(ctx, lag / MS_PER_UPDATE);
                render(ctx, 1);

            }
            animationFrameId = window.requestAnimationFrame(main);
        })();
    }

    function update() {
        // Ball MOVEMENT
        ballX += ballSpeedX;
        ballY += ballSpeedY;

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
        if (ballX + 20 > canvas.width) {
            if (ballY > rightPaddleY &&
                ballY < rightPaddleY + PADDLE_HEIGHT
            ) {
                ballSpeedX = -ballSpeedX;

                let deltaY = ballY - (rightPaddleY + PADDLE_HEIGHT / 2);
                ballSpeedY = deltaY * 0.35; // Normalized deltaY
            } else {
                player1Score++;
                ballReset();
            }
        }
        if (ballX < 0) {
            if (ballY > leftPaddleY &&
                ballY < leftPaddleY + PADDLE_HEIGHT
            ) {
                ballSpeedX = -ballSpeedX;

                let deltaY = ballY - (leftPaddleY + PADDLE_HEIGHT / 2);
                ballSpeedY = deltaY * 0.35;
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
    }

    function render(ctx, lag) {
        // Field
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ball
        ctx.fillStyle = 'white';
        ctx.fillRect(ballX + (ballSpeedX * lag), ballY + (ballSpeedY * lag), 20, 20);

        // Left paddle
        drawPaddle(ctx, 0, leftPaddleY);

        // Right paddle
        drawPaddle(ctx, canvas.width - PADDLE_THICKNESS, rightPaddleY);

        ctx.fillText(player1Score, 100, 100);
        ctx.fillText(player2Score, canvas.width - 100, 100);
    }

    // NOTE: Disabled for now
    function handleAIMovement() {
        const rightPaddleCenter = rightPaddleY + (PADDLE_HEIGHT / 2);
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
    }

    function ballReset() {

        if (player1Score >= WINNING_SCORE ||
            player2Score >= WINNING_SCORE) {
            player1Score = 0;
            player2Score = 0;
        }

        ballX = canvas.width / 2;
        ballY = canvas.height / 2;

        ballSpeedX = -ballSpeedX;
        ballSpeedY = 3;
    }

    return start;
}

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

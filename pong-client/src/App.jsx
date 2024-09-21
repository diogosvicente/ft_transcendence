import { useEffect, useRef } from 'react';
//import './App.css'

function Canvas() {
    const canvasRef = useRef(null);

    let SinglePlayerMode = false;

    function toggleGameMode() {
        SinglePlayerMode = !SinglePlayerMode;
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // ~60 updates/second
        const MS_PER_UPDATE = 16.67;

        const PADDLE_HEIGHT = 100;
        const PADDLE_THICKNESS = 10;

        let ballX = 300;
        let ballY = 300;

        let ballSpeedX = 6;
        let ballSpeedY = 6;

        let leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
        let rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;

        // Player1 controls
        let qPressed = false;
        let aPressed = false;

        // Player2 controls
        let upPressed = false;
        let downPressed = false;

        document.addEventListener("keydown", keyDownHandler, false);
        document.addEventListener("keyup", keyUpHandler, false);

        let lastFrame;
        let lag = 0.0;

        // Immediately-Invoked Function Expression (IIFE)
        ; (() => {
            function main(tFrame) {
                window.requestAnimationFrame(main);

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
                render(lag / MS_PER_UPDATE);

            }
            window.requestAnimationFrame(main);
        })();

        function handleAIMovement() {
            const rightPaddleCenter = rightPaddleY + (PADDLE_HEIGHT / 2);
            if (ballSpeedX > 0) {
                if (ballY > rightPaddleCenter) {
                    rightPaddleY += 5;
                }
                if (ballY < rightPaddleCenter) {
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
            if (SinglePlayerMode) {
                handleAIMovement();
            } else {
                if (upPressed) {
                    rightPaddleY -= 5;
                }
                if (downPressed) {
                    rightPaddleY += 5;
                }
            }

            // COLLISION for PADDLES
            if (ballX + 20 > canvas.width) {
                if (ballY > rightPaddleY &&
                    ballY < rightPaddleY + PADDLE_HEIGHT
                ) {
                    ballSpeedX = -ballSpeedX;
                } else {
                    ballReset();
                }
            }
            if (ballX < 0) {
                if (ballY > leftPaddleY &&
                    ballY < leftPaddleY + PADDLE_HEIGHT
                ) {
                    ballSpeedX = -ballSpeedX;
                } else {
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

        function render(lag) {
            // Field
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Ball
            ctx.fillStyle = 'white';
            ctx.fillRect(ballX + (ballSpeedX * lag), ballY + (ballSpeedY * lag), 20, 20);

            // Left paddle
            ctx.fillStyle = 'white';
            ctx.fillRect(
                0,
                leftPaddleY,
                PADDLE_THICKNESS,
                PADDLE_HEIGHT
            );

            // Right paddle
            ctx.fillStyle = 'white';
            ctx.fillRect(
                canvas.width - 10,
                rightPaddleY,
                PADDLE_THICKNESS,
                PADDLE_HEIGHT
            );
        }

        function keyDownHandler(e) {
            if (e.code === "ArrowUp") {
                upPressed = true;
            }
            if (e.code === "ArrowDown") {
                downPressed = true;
            }

            if (e.code === "KeyQ") {
                qPressed = true;
            }
            if (e.code === "KeyA") {
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

            if (e.code === "KeyQ") {
                qPressed = false;
            }
            if (e.code === "KeyA") {
                aPressed = false;
            }
        }

        function ballReset() {
            ballX = canvas.width / 2;
            ballY = canvas.height / 2;

            ballSpeedX = -ballSpeedX;
        }

    }, []);

    return (
        <>
            <canvas ref={canvasRef} width={800} height={590}></canvas>
            <button onClick={toggleGameMode}>COM Player</button>
        </>
    );
}

function App() {

    return (
        <>
            <Canvas />
        </>
    );

}

export default App

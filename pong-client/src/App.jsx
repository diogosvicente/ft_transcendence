import { useEffect, useRef } from 'react';
//import './App.css'

function Canvas() {
    const canvasRef = useRef(null);

    let ballX = useRef(300);

    let ballDir = useRef(1);

    let leftPaddleY = 0;

    let upPressed = false;
    let downPressed = false;

    function keyDownHandler(e) {
        if (e.code === "ArrowUp") {
            upPressed = true;
        }
        if (e.code === "ArrowDown") {
            downPressed = true;
        }
    }

    function keyUpHandler(e) {
        if (e.code === "ArrowUp") {
            upPressed = false;
        }
        if (e.code === "ArrowDown") {
            downPressed = false;
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        document.addEventListener("keydown", keyDownHandler, false);
        document.addEventListener("keyup", keyUpHandler, false);

        let lastFrame;
        let lag = 0.0;

        const MS_PER_UPDATE = 16.7;

        // Immediately-Invoked Function Expression (IIFE)
        ; (() => {
            function main(tFrame) {
                requestAnimationFrame(main);

                if (lastFrame === undefined) {
                    lastFrame = tFrame;
                }

                let dt = tFrame - lastFrame;
                lastFrame = tFrame;
                lag += dt;

                // Fixed update timestep, variable rendering
                while (lag >= MS_PER_UPDATE) {
                    ballX.current += 1 * ballDir.current;

                    if (upPressed) {
                        leftPaddleY -= 5;
                    }
                    if (downPressed) {
                        leftPaddleY += 5;
                    }

                    // Handle collision for horizontal edges
                    if (ballX.current + 20 > canvas.width) {
                        ballDir.current = -ballDir.current;
                    }
                    if (ballX.current < 0) {
                        ballDir.current = -ballDir.current;
                    }

                    lag -= MS_PER_UPDATE;
                }

                // Field
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Ball
                ctx.fillStyle = 'white';
                ctx.fillRect(ballX.current + (lag / 16.7), 50, 20, 20);

                // Left paddle
                ctx.fillStyle = 'white';
                ctx.fillRect(0, leftPaddleY, 10, 100);
            }
            window.requestAnimationFrame(main);

        })();

    }, []);

    return (
        <>
            <canvas ref={canvasRef} width={800} height={590}></canvas>
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

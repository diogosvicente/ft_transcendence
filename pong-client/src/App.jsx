import { useEffect, useRef, useState } from 'react';
//import './App.css'

function Canvas() {
    const canvasRef = useRef(null);

    let ballX = useRef(50);
    let ballDir = useRef(1);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Immediately-Invoked Function Expression (IIFE)
        ; (() => {
            function main() {
                window.requestAnimationFrame(main);
                if (ballX.current + 25 >= canvas.width ||
                    ballX.current <= 0) {
                    ballDir.current *= -1;
                }

                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = 'white';
                ctx.fillRect(ballX.current, 50, 25, 25);
                ballX.current += (1.2 * ballDir.current);
            }
            main();
        })();

    }, []);

    return (
        <canvas ref={canvasRef} width={800} height={590}></canvas>
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

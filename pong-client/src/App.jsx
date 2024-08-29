import { useEffect, useRef } from 'react';
//import './App.css'

function Canvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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

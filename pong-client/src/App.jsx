import { useEffect, useRef } from 'react';

import { gameCore } from './gameCore.js';

function Canvas() {
    const canvasRef = useRef(null);

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 590;

    useEffect(() => {
        const canvas = canvasRef.current;

        const gameCore = gameCore(canvas);
        gameCore.start();

    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}>
            </canvas>
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

export default App;

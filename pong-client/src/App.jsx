import { useEffect, useRef } from 'react';

import { GameCore } from './GameCore.js';

function Canvas() {
    const canvasRef = useRef(null);

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 590;

    useEffect(() => {
        const canvas = canvasRef.current;

        const game = new GameCore(canvas);
        game.start();

        // TODO: Add a cleanup function
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

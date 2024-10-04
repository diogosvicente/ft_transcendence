import { useEffect, useRef } from 'react';

import { loadGameCore } from './gameCore';

function Canvas() {
    const canvasRef = useRef(null);

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 590;

    useEffect(() => {
        const canvas = canvasRef.current;

        const gameCore = loadGameCore(canvas);
        gameCore.start();

        return () => {
            gameCore.stop();
        };

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

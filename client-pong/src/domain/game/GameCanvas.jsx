import { useEffect, useRef } from "react";

import { gameCore } from "./gameCore.js";

export function GameCanvas() {
  const canvasRef = useRef(null);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 590;

  useEffect(() => {
    const canvas = canvasRef.current;

    const game = gameCore(canvas);
    game.start();

    // TODO: Add a cleanup function
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      ></canvas>
    </>
  );
}

import { useEffect, useRef, useState } from "react";

export const Canvas = () => {
  const canvasRef = useRef(null);

  const wsRef = useRef(null);

  const gameStateRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/game/");

    ws.onopen = (event) => {
      console.log("WebSocket connection openned");
    };

    ws.onmessage = (event) => {
      gameStateRef.current = JSON.parse(event.data);
      console.log(gameStateRef.current);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };

  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function mainLoop() {
      if (gameStateRef.current && gameStateRef.current.isRunning) {
        window.requestAnimationFrame(main);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Your main loop contents
    }
    mainLoop(); // Start the cycle

  }, []);

  const toggleStartPause = () => {
    const action = gameStateRef.current.isRunning ? "stop_game" : "start_game";
    wsRef.current.send(JSON.stringify({ "action": action }));
    console.log(gameStateRef.current.isRunning);
    gameStateRef.current.isRunning = !gameStateRef.current.isRunning;
  };

  return (
    <>
      <canvas width={800} height={590} ref={canvasRef}></canvas>
      <input type="button" onClick={toggleStartPause} value={"Start/Pause"} />
    </>
  );
};

export default Canvas;

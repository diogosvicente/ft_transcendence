import { useEffect, useRef, useState } from "react";

export const Canvas = () => {
  const canvasRef = useRef(null);

  const wsRef = useRef(null);

  const gameStateRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);

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

    isRunningRef.current = isRunning;
    const renderLoop = () => {
      console.log(isRunningRef.current);
      if (isRunningRef.current) {
        window.requestAnimationFrame(renderLoop);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    renderLoop();

  }, []);

  const toggleRunning = () => {
    /*TODO: send message to the server
     *so it sends us the game state*/
    wsRef.current.send(JSON.stringify({ "action": isRunning ? "stop_game" : "start_game" }))
    setIsRunning(!isRunning);
  };

  return (
    <>
      <canvas width={800} height={590} ref={canvasRef}></canvas>
      <input type="button" onClick={toggleRunning} value="Start/Stop" />
    </>
  );
};

export default Canvas;

import { useEffect, useRef, useState } from "react";
import { getWsUrl } from "../../assets/config/config";

export const Canvas = () => {
  const canvasRef = useRef(null);

  const wsRef = useRef(null);

  const gameStateRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const ws = new WebSocket(getWsUrl("/ws/game/"));

    ws.onopen = (event) => {
      console.log("WebSocket connection openned");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        console.log(data.message);
        return;
      }
      gameStateRef.current = data;
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
      if (isRunningRef.current) {
        window.requestAnimationFrame(renderLoop);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      console.log(gameStateRef.current);

      // draw ball
      ctx.fillStyle = "white";
      ctx.fillRect(
        gameStateRef.current.ball.position.x,
        gameStateRef.current.ball.position.y,
        20,
        20,
      )

    }
    if (gameStateRef.current) {
      renderLoop();
    }

  }, [isRunning]);

  const toggleRunning = () => {
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

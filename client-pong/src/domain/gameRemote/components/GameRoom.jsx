import React, { useEffect, useRef, useState } from "react";
import { gameCore } from "../core/gameCore";

const GameRoom = ({ matchId }) => {
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/game/${matchId}/`);
    setSocket(ws);

    let game;

    ws.onopen = () => {
        console.log(`Conectado à sala room_${matchId}`);
        const canvas = canvasRef.current;

        if (canvas) {
            game = gameCore(canvas, (state) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "state_update", state }));
                }
            });

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === "state_update") {
                    game.syncState(data.state);
                }
            };

            ws.send(JSON.stringify({ type: "player_join" }));
            game.start();
        }
    };

    return () => {
        ws.close();
    };
  }, [matchId]);

  return (
    <div>
      <h1>Sala de Jogo: {matchId}</h1>
      <canvas ref={canvasRef} width="800" height="600"></canvas>
    </div>
  );
};

export default GameRoom;

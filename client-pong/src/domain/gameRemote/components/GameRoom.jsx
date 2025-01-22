import React, { useEffect, useRef, useState } from "react";
import { gameCore } from "../core/gameCore";

const GameRoom = ({ matchId }) => {
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // Estado para o status da conexão
  const gameRef = useRef(null); // Referência ao jogo para evitar recriação desnecessária

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/game/${matchId}/`);
    setSocket(ws);

    ws.onopen = () => {
      console.log(`Conectado à sala room_${matchId}`);
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Mensagem recebida do WebSocket:", data);

      if (data.event === "state_update" && gameRef.current) {
        gameRef.current.syncState(data.state);
      }
    };

    ws.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
      setConnectionStatus("error");
    };

    ws.onclose = () => {
      console.log("WebSocket desconectado.");
      setConnectionStatus("disconnected");
    };

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [matchId]);

  useEffect(() => {
    if (connectionStatus === "connected" && canvasRef.current) {
      console.log("Canvas encontrado. Iniciando o jogo...");
      const game = gameCore(canvasRef.current, (state) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ event: "state_update", state }));
        }
      });

      game.start();
      gameRef.current = game; // Armazena a instância do jogo na referência
    } else if (connectionStatus === "connected" && !canvasRef.current) {
      console.error("Canvas ainda não está pronto.");
    }
  }, [connectionStatus, canvasRef, socket]);

  return (
    <div>
      <h1>Sala de Jogo: {matchId}</h1>
      {connectionStatus === "connecting" && <p>Conectando ao servidor...</p>}
      {connectionStatus === "connected" && (
        <canvas ref={canvasRef} width="800" height="600"></canvas>
      )}
      {connectionStatus === "error" && <p>Erro ao conectar. Tente novamente mais tarde.</p>}
      {connectionStatus === "disconnected" && <p>Conexão perdida. Tente recarregar a página.</p>}
    </div>
  );
};

export default GameRoom;

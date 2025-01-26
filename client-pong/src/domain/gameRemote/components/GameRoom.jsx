import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../template/Navbar";
import { gameCore } from "../core/gameCore";
import "../../../assets/styles/gameRoom.css";
import API_BASE_URL from "../../../assets/config/config";

const GameRoom = ({ matchId, userId, matchData, isPlayer1 }) => {
  const canvasRef = useRef(null);
  const gameRef = useRef(null); // Referência para o gameCore
  const [socket, setSocket] = useState(null);
  const [assignedSide, setAssignedSide] = useState(null); // Lado do jogador
  const [countdown, setCountdown] = useState(null); // Contagem regressiva
  const [pendingState, setPendingState] = useState(null); // Armazena estado pendente
  const defaultAvatar = `${API_BASE_URL}/media/avatars/default.png`; // Avatar padrão

  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    const wsUrl = `ws://localhost:8000/ws/game/${matchId}/?access_token=${accessToken}`;
    const ws = new WebSocket(wsUrl);
    setSocket(ws);
  
    const canvas = canvasRef.current;
  
    // Inicializa o canvas com gameCore
    if (canvas && !gameRef.current) {
      gameRef.current = gameCore(canvas);
    }
  
    // Atualiza o canvas em tempo real
    const animate = () => {
      if (pendingState && gameRef.current) {
        gameRef.current.renderState(pendingState);
      }
      requestAnimationFrame(animate); // Mantém o loop de animação
    };
  
    animate();
  
    ws.onopen = () => {
      console.log("WebSocket conectado.");
    };
  
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Mensagem WebSocket recebida:", data);
  
      switch (data.type) {
        case "state_update":
          // Salva o estado mais recente para renderização
          setPendingState(data.state);
          break;
  
        case "assigned_side":
          setAssignedSide(data.side);
          break;
  
        case "countdown":
          setCountdown(data.message);
          break;
  
        case "game_start":
          setCountdown(null); // Remove a contagem regressiva
          break;
  
        default:
          console.warn("Mensagem desconhecida recebida:", data);
      }
    };
  
    ws.onclose = () => {
      console.warn("WebSocket desconectado.");
    };
  
    ws.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };
  
    return () => {
      console.log("Limpando WebSocket...");
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [matchId, pendingState]);

  const handleKeyDown = (e) => {
    if (!assignedSide || !socket) return;

    if (socket.readyState !== WebSocket.OPEN) {
      console.warn("Tentativa de enviar mensagem para WebSocket fechado.");
      return;
    }

    if (["w", "s"].includes(e.key)) {
      console.log(`Enviando movimento para o backend: ${e.key === "w" ? "up" : "down"}`);
      socket.send(
        JSON.stringify({
          type: "player_move",
          direction: e.key === "w" ? "up" : "down",
        })
      );
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [assignedSide, socket]);

  if (!matchData || assignedSide === null) {
    return <div>Carregando informações da partida...</div>;
  }

  return (
    <div>
        <Navbar />
        <div className="game-room">
            <div className="game-info">
                <h1>Partida Remota</h1>
                <div className="players-info">
                    <div className="player">
                        <img
                            src={matchData.player1_avatar ? `${API_BASE_URL}${matchData.player1_avatar}` : defaultAvatar}
                            alt={matchData.player1_display}
                            className="avatar"
                        />
                        <p>{matchData.player1_display}</p>
                        {isPlayer1 && <p>(você)</p>}
                    </div>
                    <span>VS</span>
                    <div className="player">
                        <img
                            src={matchData.player2_avatar ? `${API_BASE_URL}${matchData.player2_avatar}` : defaultAvatar}
                            alt={matchData.player2_display}
                            className="avatar"
                        />
                        <p>{matchData.player2_display}</p>
                        {!isPlayer1 && <p>(você)</p>}
                    </div>
                </div>
            </div>

            <div className="game-board">
                <canvas ref={canvasRef} width="800" height="600"></canvas>
                {countdown && (
                    <div className="countdown-overlay">
                        <p className="countdown-text">{countdown}</p>
                    </div>
                )}
                {assignedSide && (
                    <p className="paddle-info">
                        Você controla o paddle: <strong>{assignedSide === "left" ? "Esquerda" : "Direita"}</strong>
                    </p>
                )}
            </div>
        </div>
    </div>
);

};

export default GameRoom;

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

    const initializeGame = () => {
      const canvas = canvasRef.current;
      if (canvas && !gameRef.current) {
        gameRef.current = gameCore(canvas); // Inicializa o gameCore e salva em gameRef
        console.log("Game inicializado com sucesso.");

        // Renderiza o estado pendente, se existir
        if (pendingState) {
          console.log("Renderizando estado pendente...");
          gameRef.current.renderState(pendingState);
          setPendingState(null); // Limpa o estado pendente após renderizar
        }
      }
    };

    ws.onopen = () => {
      console.log("WebSocket conectado.");
      initializeGame(); // Inicializa o game assim que o WebSocket conectar
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Mensagem WebSocket recebida:", data);

      switch (data.type) {
        case "assigned_side":
          setAssignedSide(data.side);
          console.log(`Jogador configurado no lado: ${data.side}`);
          break;

        case "countdown":
          console.log("Mensagem de contagem regressiva recebida:", data.message);
          setCountdown(data.message);
          break;
        
        case "game_start":
          console.log("Jogo iniciado após a contagem regressiva.");
          setCountdown(null); // Remove a contagem regressiva
          break;

        case "state_update":
          if (gameRef.current) {
            console.log("Renderizando estado do jogo:", data.state);
            gameRef.current.renderState(data.state);
          } else {
            console.warn("Game ainda não foi inicializado. Salvando estado pendente.");
            setPendingState(data.state); // Salva estado pendente para renderizar depois
          }
          break;

        default:
          console.warn("Mensagem desconhecida:", data);
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

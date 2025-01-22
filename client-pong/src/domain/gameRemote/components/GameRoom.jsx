import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../template/Navbar";
import { gameCore } from "../core/gameCore";
import "../../../assets/styles/gameRoom.css";
import API_BASE_URL from "../../../assets/config/config";

const GameRoom = ({ matchId, userId, matchData, isPlayer1 }) => {
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [assignedSide, setAssignedSide] = useState(null); // Lado atribuído ao jogador
  const [countdown, setCountdown] = useState(null); // Contagem regressiva
  const defaultAvatar = `${API_BASE_URL}/media/avatars/default.png`; // Caminho do avatar padrão

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/game/${matchId}/`);
    setSocket(ws);

    let game;

    ws.onopen = () => {
      const canvas = canvasRef.current;

      if (canvas) {
        game = gameCore(canvas, (state) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "state_update",
                state,
              })
            );
          }
        });

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "assigned_side":
              setAssignedSide(data.side);
              console.log(`Jogador configurado no lado: ${data.side}, ID: ${data.player_id}`);
              console.log("DATENA" , JSON.stringify(data));
              game.setPlayerSide(data.side);
              break;

            case "player_join":
              console.log(`Jogador conectado: ID=${data.player_id}, Lado=${data.side}`);
              break;

            case "player_disconnect":
              console.log(`Jogador desconectado: ID=${data.player_id}`);
              break;

            case "countdown":
              setCountdown(data.message);
              break;

            case "start_game":
              setCountdown(null); // Remove a contagem regressiva
              game.startWithDirection(data.ball_direction);
              break;

            case "state_update":
              game.syncState(data.state);
              break;

            case "player_move":
              game.updatePaddlePosition(data.paddle, data.position);
              break;

            default:
              console.warn("Mensagem desconhecida:", data);
          }
        };

        game.start();
      }
    };

    return () => {
      if (game) {
        game.stop();
      }
      ws.close();
    };
  }, [matchId]);

  // Evento para movimentar o paddle com base na tecla pressionada
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!assignedSide) return;

      if (assignedSide === "left" && (e.key === "w" || e.key === "s")) {
        socket.send(
          JSON.stringify({
            type: "player_move",
            direction: e.key === "w" ? "up" : "down",
          })
        );
      } else if (assignedSide === "right" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        socket.send(
          JSON.stringify({
            type: "player_move",
            direction: e.key === "ArrowUp" ? "up" : "down",
          })
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [assignedSide, socket]);

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

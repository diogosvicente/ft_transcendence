import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../template/Navbar";
import { gameCore } from "../core/gameCore";
import { useNavigate } from "react-router-dom";
import "../../../assets/styles/gameRoom.css";
import API_BASE_URL, { getWsUrl } from "../../../assets/config/config";
import { useTranslation } from "react-i18next";

const GameRoom = ({ matchId, userId, matchData, isPlayer1 }) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [assignedSide, setAssignedSide] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [pendingState, setPendingState] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // Referência para armazenar o intervalo de movimento
  const moveIntervalRef = useRef(null);

  const defaultAvatar = `${API_BASE_URL}/media/avatars/default.png`;

  // Envia comando de movimento (W ou S) repetidamente
  const handlePressStart = (directionKey, event) => {
    event.preventDefault(); // evita zoom/scroll indesejado no mobile
    if (!assignedSide || !socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) return;

    // Se já existir um intervalo ativo, não cria outro
    if (moveIntervalRef.current) return;

    // Cria intervalo para enviar comando a cada 100ms
    moveIntervalRef.current = setInterval(() => {
      socketRef.current.send(
        JSON.stringify({
          type: "player_move",
          direction: directionKey === "w" ? "up" : "down",
        })
      );
    }, 100);
  };

  // Para de enviar comandos ao soltar o botão
  const handlePressEnd = () => {
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    const wsUrl = `${getWsUrl(`/ws/game/${matchId}/`)}?access_token=${accessToken}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket conectado.");
      const canvas = canvasRef.current;
      if (canvas && !gameRef.current) {
        gameRef.current = gameCore(canvas);
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "assigned_side":
          setAssignedSide(data.side);
          break;
        case "countdown":
          setCountdown(data.state?.message || null);
          break;
        case "wo_countdown":
          setCountdown(data.state?.countdown || null);
          break;
        case "game_start":
          setCountdown(null);
          break;
        case "paused":
          setIsPaused(true);
          break;
        case "resumed":
          setIsPaused(false);
          if (pendingState && gameRef.current) {
            gameRef.current.renderState(pendingState);
            setPendingState(null);
          }
          break;
        case "state_update":
          if (gameRef.current) {
            gameRef.current.renderState(data.state);
          } else {
            setPendingState(data.state);
          }
          break;
        case "walkover":
          alert(data.state.message);
          navigate(data.state.redirect_url);
          break;
        case "match_finished":
          const currentUserId = localStorage.getItem("id");
          const finalAlertMessage = data.state.final_alert[currentUserId] || "";
          if (window.confirm(finalAlertMessage)) {
            navigate(data.state.redirect_url);
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
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [matchId, navigate]);

  // Renderiza estado pendente se o jogo não estava inicializado
  useEffect(() => {
    if (pendingState && !gameRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        gameRef.current = gameCore(canvas);
        gameRef.current.renderState(pendingState);
        setPendingState(null);
      }
    }
  }, [pendingState]);

  // Lida com teclas W/S no desktop
  const handleKeyDown = (e) => {
    if (!assignedSide || !socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) return;

    if (["w", "s"].includes(e.key)) {
      socketRef.current.send(
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
  }, [assignedSide, isPaused]);

  const togglePause = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: isPaused ? "resume_game" : "pause_game",
        })
      );
    }
  };

  if (!matchData || assignedSide === null) {
    return <div>{t("gameroom.loading")}</div>;
  }

  return (
    <div>
      <Navbar />
      <div className="game-room">
        <div className="game-info">
          <h1>{t("gameroom.remote_match")}</h1>
          <button className="pause-button" onClick={togglePause}>
            {isPaused ? t("gameroom.resume_game") : t("gameroom.pause_game")}
          </button>
          <div className="players-info">
            <div className="player">
              {/* Avatar do Player 1 */}
              <img
                src={
                  matchData.player1_avatar
                    ? `${API_BASE_URL}${matchData.player1_avatar}`
                    : defaultAvatar
                }
                alt={matchData.player1_display}
                className="avatar"
              />
              <p>{matchData.player1_display}</p>
              {isPlayer1 && <p>({t("gameroom.you")})</p>}
            </div>
            <span>VS</span>
            <div className="player">
              {/* Avatar do Player 2 */}
              <img
                src={
                  matchData.player2_avatar
                    ? `${API_BASE_URL}${matchData.player2_avatar}`
                    : defaultAvatar
                }
                alt={matchData.player2_display}
                className="avatar"
              />
              <p>{matchData.player2_display}</p>
              {!isPlayer1 && <p>({t("gameroom.you")})</p>}
            </div>
          </div>
        </div>

        <div className="game-board">
          {isPaused && (
            <div className="overlay">
              <p className="overlay-text">{t("gameroom.paused")}</p>
            </div>
          )}
          <canvas ref={canvasRef} width="800" height="600"></canvas>

          {countdown && (
            <div className="countdown-overlay">
              <p className="countdown-text">{countdown}</p>
            </div>
          )}

          {assignedSide && (
            <p className="paddle-info">
              {t("gameroom.you_control_paddle")} <strong>{t(`gameroom.side_${assignedSide}`)}</strong>
            </p>
          )}

          {/* Botões de controle (mobile) */}
          <div className="mobile-controls">
            <button
              onMouseDown={(e) => handlePressStart("w", e)}
              onTouchStart={(e) => handlePressStart("w", e)}
              onMouseUp={handlePressEnd}
              onTouchEnd={handlePressEnd}
            >
              ▲
            </button>
            <button
              onMouseDown={(e) => handlePressStart("s", e)}
              onTouchStart={(e) => handlePressStart("s", e)}
              onMouseUp={handlePressEnd}
              onTouchEnd={handlePressEnd}
            >
              ▼
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;

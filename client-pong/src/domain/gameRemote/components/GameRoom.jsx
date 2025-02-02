import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../template/Navbar";
import { gameCore } from "../core/gameCore";
import { useNavigate } from "react-router-dom";
import "../../../assets/styles/gameRoom.css";
import API_BASE_URL, { getWsUrl } from "../../../assets/config/config";

const GameRoom = ({ matchId, userId, matchData, isPlayer1 }) => {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const navigate = useNavigate();
  // Usamos useRef para armazenar a conexão WebSocket de forma estável
  const socketRef = useRef(null);
  const [assignedSide, setAssignedSide] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [pendingState, setPendingState] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const defaultAvatar = `${API_BASE_URL}/media/avatars/default.png`;

  // useEffect para criar a conexão WebSocket (única vez por matchId)
  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    const wsUrl = `${getWsUrl(`/ws/game/${matchId}/`)}?access_token=${accessToken}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    const initializeGame = () => {
      const canvas = canvasRef.current;
      if (canvas && !gameRef.current) {
        gameRef.current = gameCore(canvas);
        console.log("Game inicializado com sucesso.");
        if (pendingState) {
          console.log("Renderizando estado pendente...");
          gameRef.current.renderState(pendingState);
          setPendingState(null);
        }
      }
    };

    ws.onopen = () => {
      console.log("WebSocket conectado.");
      initializeGame();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // console.log("Mensagem WebSocket recebida:", data);

      switch (data.type) {
        case "assigned_side":
          setAssignedSide(data.side);
          console.log(`Jogador configurado no lado: ${data.side}`);
          break;

        case "countdown":
          const countdownMessage = data.state?.message;
          if (countdownMessage) {
            setCountdown(countdownMessage);
          } else {
            console.warn("⚠ A contagem regressiva veio sem dados válidos:", data);
          }
          break;

        case "wo_countdown":
          if (data.state?.countdown !== undefined) {
            setCountdown(data.state.countdown);
            console.log(`Contagem para WO: ${data.state.countdown}`);
          } else {
            console.warn("⚠ Dados inválidos para WO countdown:", data);
          }
          break;

        case "game_start":
          console.log("Jogo iniciado após a contagem regressiva.");
          setCountdown(null);
          break;

        case "paused":
          setIsPaused(true);
          console.log("Partida pausada.");
          break;

        case "resumed":
          setIsPaused(false);
          console.log("Partida retomada.");
          if (pendingState && gameRef.current) {
            gameRef.current.renderState(pendingState);
            setPendingState(null);
          }
          break;

        case "state_update":
          if (gameRef.current) {
            gameRef.current.renderState(data.state);
          } else {
            console.warn("Game ainda não foi inicializado. Salvando estado pendente.");
            setPendingState(data.state);
          }
          break;

        case "walkover":
          alert(data.state.message);
          console.log("Partida finalizada por WO. Redirecionando...");
          navigate(data.state.redirect_url);
          break;

        case "match_finished":
          // Exibe um alerta com a mensagem final e um botão "OK" para sair da partida
          if (window.confirm(data.state.final_alert)) {
            console.log("Partida finalizada por pontos. Redirecionando...");
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
      console.log("Limpando WebSocket...");
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [matchId]);

  // Esse useEffect monitora mudanças em pendingState para inicializar o game se ainda não estiver feito
  useEffect(() => {
    if (pendingState && !gameRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        gameRef.current = gameCore(canvas);
        console.log("Game inicializado via pendingState.");
        gameRef.current.renderState(pendingState);
        setPendingState(null);
      }
    }
  }, [pendingState]);

  const handleKeyDown = (e) => {
    if (!assignedSide || !socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("Tentativa de enviar mensagem para WebSocket fechado.");
      return;
    }
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
    return <div>Carregando informações da partida...</div>;
  }

  return (
    <div>
      <Navbar />
      <div className="game-room">
        <div className="game-info">
          <h1>Partida Remota</h1>
          <button className="pause-button" onClick={togglePause}>
            {isPaused ? "Retomar Partida" : "Pausar Partida"}
          </button>
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
          {isPaused && (
            <div className="overlay">
              <p className="overlay-text">A partida está pausada.</p>
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
              Você controla o paddle: <strong>{assignedSide === "left" ? "Esquerda" : "Direita"}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameRoom;

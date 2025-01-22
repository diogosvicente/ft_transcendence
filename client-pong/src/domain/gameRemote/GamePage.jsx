import React from "react";
import { useParams, Navigate } from "react-router-dom";
import GameRoom from "./components/GameRoom";

const GamePage = () => {
  const { matchId } = useParams(); // Obtém o matchId da URL

  // Valida o matchId
  if (!matchId) {
    console.error("ID da partida não encontrado na URL.");
    return <Navigate to="/" replace />; // Redireciona para a página inicial
  }

  return (
    <div className="game-page">
      <h1>Partida Remota</h1>
      {/* Renderiza o GameRoom com o matchId */}
      <GameRoom matchId={matchId} />
    </div>
  );
};

export default GamePage;

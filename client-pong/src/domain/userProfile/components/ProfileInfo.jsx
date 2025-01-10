import React from "react";
import useFetchRank from "../hooks/useFetchRank";

const ProfileInfo = ({ user, totalMatches, winRate }) => {
  const { rank, error } = useFetchRank(user.id);

  const getRankHighlight = (rank) => {
    if (rank === 1) {
      return (
        <span className="rank-highlight gold">
          Ranking (Torneios Vencidos): 🏆 1º Lugar - Medalha de Ouro
        </span>
      );
    } else if (rank === 2) {
      return (
        <span className="rank-highlight silver">
          Ranking (Torneios Vencidos): 🥈 2º Lugar - Medalha de Prata
        </span>
      );
    } else if (rank === 3) {
      return (
        <span className="rank-highlight bronze">
          Ranking (Torneios Vencidos): 🥉 3º Lugar - Medalha de Bronze
        </span>
      );
    }
    return <span>Ranking (Torneios Vencidos): {rank}</span>;
  };

  return (
    <div className="profile-info">
      <h2>Estatísticas</h2>
      <p>Partidas Jogadas: {totalMatches}</p>
      <p>Vitórias: {user.wins || 0}</p>
      <p>Derrotas: {user.losses || 0}</p>
      <p>Taxa de Vitória: {winRate}%</p>
      {error ? (
        <p className="text-danger">Erro: {error}</p>
      ) : (
        <p>{rank ? getRankHighlight(rank) : "Carregando..."}</p>
      )}
    </div>
  );
};

export default ProfileInfo;

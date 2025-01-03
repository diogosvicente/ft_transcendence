import React from "react";

const ProfileInfo = ({ user, totalMatches, winRate }) => {
  return (
    <div className="profile-info">
      <h2>Estatísticas</h2>
      <p>Partidas Jogadas: {totalMatches}</p>
      <p>Vitórias: {user.wins || 0}</p>
      <p>Derrotas: {user.losses || 0}</p>
      <p>Taxa de Vitória: {winRate}%</p>
      <p>Ranking: {user.rank}</p>
    </div>
  );
};

export default ProfileInfo;

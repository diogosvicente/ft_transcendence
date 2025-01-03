import React from "react";

const MatchHistory = ({ matchHistory }) => {
  return (
    <div className="match-history">
      <h2>Histórico de Partidas</h2>
      {matchHistory.length > 0 ? (
        <table className="match-history-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Adversário</th>
              <th>Resultado</th>
              <th>Placar</th>
            </tr>
          </thead>
          <tbody>
            {matchHistory.map((match) => (
              <tr key={match.id}>
                <td>{new Date(match.date).toLocaleDateString()}</td>
                <td>{match.opponent_display_name}</td>
                <td>{match.result}</td>
                <td>{match.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Nenhum histórico de partidas encontrado.</p>
      )}
    </div>
  );
};

export default MatchHistory;

// TournamentMatchQueue.jsx
import React from "react";

const TournamentMatchQueue = ({ matches }) => {
  // Ordena as partidas pelo id (ou outro critério, se necessário)
  const sortedMatches = [...matches].sort((a, b) => a.id - b.id);

  return (
    <div className="tournament-match-queue">
      <h3>Fila de Partidas</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>N°</th>
            <th>Jogadores</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedMatches.length > 0 ? (
            sortedMatches.map((match, index) => (
              <tr key={match.id}>
                <td>{index + 1}</td>
                <td>
                  {match.player1_display || "Jogador 1"} vs{" "}
                  {match.player2_display || "Jogador 2"}
                </td>
                <td>
                  {match.status === "pending" && (
                    <span className="badge bg-secondary">Pendente</span>
                  )}
                  {match.status === "ongoing" && (
                    <span className="badge bg-warning">Em Andamento</span>
                  )}
                  {match.status === "completed" && (
                    <span className="badge bg-success">Concluída</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">Nenhuma partida registrada.</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="tournament-stats">
        <p>
          <strong>Total de Partidas:</strong> {matches.length}
        </p>
        <p>
          <strong>Concluídas:</strong>{" "}
          {matches.filter((m) => m.status === "completed").length}
        </p>
        <p>
          <strong>Pendentes:</strong>{" "}
          {matches.filter((m) => m.status === "pending").length}
        </p>
        <p>
          <strong>Em Andamento:</strong>{" "}
          {matches.filter((m) => m.status === "ongoing").length}
        </p>
      </div>
    </div>
  );
};

export default TournamentMatchQueue;

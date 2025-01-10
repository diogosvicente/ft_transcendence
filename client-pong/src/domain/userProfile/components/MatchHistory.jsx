import React from "react";
import { useParams } from "react-router-dom";
import useFetchMatchHistory from "../hooks/useFetchMatchHistory";

const MatchHistory = ({ userId }) => {
  const { user_id } = useParams(); // Pega o user_id da URL
  const { matchHistory, error } = useFetchMatchHistory(user_id);

  return (
    <div className="match-history">
      <h2>Histórico de Partidas</h2>
      {error ? (
        <p className="text-danger">Erro: {error}</p>
      ) : matchHistory.length > 0 ? (
        <table className="match-history-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Adversário</th>
              <th>Resultado</th>
              <th>Placar</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {matchHistory.map((match) => (
              <tr key={match.id} className={match.result === "Vitória" ? "win" : "loss"}>
                <td>{new Date(match.date).toLocaleDateString()}</td>
                <td>{match.opponent_display_name}</td> {/* Exibe o display_name do adversário */}
                <td>{match.result}</td>
                <td>{`${match.score.player1} - ${match.score.player2}`}</td>
                <td>{match.tournament_name ? `Torneio: ${match.tournament_name}` : "1vs1"}</td>
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

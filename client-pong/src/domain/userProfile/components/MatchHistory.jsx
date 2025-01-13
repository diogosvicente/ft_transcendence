import React from "react";
import { useParams } from "react-router-dom";
import useFetchMatchHistory from "../hooks/useFetchMatchHistory";

const MatchHistory = () => {
  const { user_id } = useParams(); // Pega o user_id da URL
  const { matchHistory, error } = useFetchMatchHistory(user_id);

  const formatDateTime = (dateString) => {
    if (!dateString) return "Não jogado";
    const optionsDate = { day: "2-digit", month: "2-digit", year: "numeric" };
    const optionsTime = { hour: "2-digit", minute: "2-digit" };
    const date = new Date(dateString);
    return `${date.toLocaleDateString("pt-BR", optionsDate)} às ${date.toLocaleTimeString("pt-BR", optionsTime)}`;
  };

  return (
    <div className="match-history">
      <h2>Histórico de Partidas</h2>
      {error ? (
        <p className="text-danger">Erro: {error}</p>
      ) : matchHistory.length > 0 ? (
        <table className="table table-striped match-history-table">
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
              <tr
                key={match.id}
                className={match.result === "Vitória" ? "table-success" : "table-danger"}
              >
                <td>{formatDateTime(match.date)}</td>
                <td>
                  {`${match.opponent_display_name} ${
                    match.opponent_alias ? `como ${match.opponent_alias}` : ""
                  }`}
                </td>
                <td>{match.result}</td>
                <td>{`${match.score.player1 ?? "-"} - ${match.score.player2 ?? "-"}`}</td>
                <td>
                  {match.tournament_name
                    ? `Torneio: ${match.tournament_name}`
                    : "1vs1"}
                </td>
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

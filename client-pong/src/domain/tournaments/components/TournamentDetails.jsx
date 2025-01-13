import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const TournamentDetails = ({
  selectedTournament,
  participants,
  matches,
  setSelectedTournament,
}) => {
  if (!selectedTournament) {
    return <p>Erro: Torneio não encontrado.</p>;
  }

  const { tournament } = selectedTournament;

  // Função para formatar data
  const formatDate = (dateString) => {
    const optionsDate = { day: "2-digit", month: "2-digit", year: "numeric" };
    const optionsTime = { hour: "2-digit", minute: "2-digit" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("pt-BR", optionsDate),
      time: date.toLocaleTimeString("pt-BR", optionsTime),
    };
  };

  // Ordena os participantes por pontos e, em caso de empate, por data de inscrição
  const sortedParticipants = [...participants].sort((a, b) => {
    if (b.points === a.points) {
      return new Date(a.registered_at) - new Date(b.registered_at);
    }
    return b.points - a.points;
  });

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
        <h3>Informações do Torneio</h3>
        <button
          className="btn btn-secondary"
          onClick={() => setSelectedTournament(null)}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Voltar à Lista
        </button>
      </div>
      <div className="card-body">
        <p>
          <strong>Nome:</strong> {tournament?.name || "Não disponível"}
        </p>
        <p>
          <strong>Status:</strong> {tournament?.status || "Não disponível"}
        </p>
        <p>
          <strong>Data de Criação:</strong>{" "}
          {tournament?.created_at
            ? `${formatDate(tournament.created_at).date} às ${formatDate(tournament.created_at).time}`
            : "Não disponível"}
        </p>
        <p>
          <strong>Total de Participantes:</strong> {participants.length || 0}
        </p>

        <h4 className="mt-4">Participantes</h4>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Participante</th>
              <th>Alias</th>
              <th>Pontos</th>
              <th>Data de Inscrição</th>
            </tr>
          </thead>
          <tbody>
            {sortedParticipants.length > 0 ? (
              sortedParticipants.map((participant, index) => (
                <tr key={participant.id}>
                  <td>{index + 1}</td>
                  <td>{participant.user?.display_name || "Usuário desconhecido"}</td>
                  <td>{participant.alias}</td>
                  <td>{participant.points} pontos</td>
                  <td>
                    {formatDate(participant.registered_at).date} às{" "}
                    {formatDate(participant.registered_at).time}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  Nenhum participante registrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h4>Partidas</h4>
        <div className="list-group">
          {matches.length > 0 ? (
            matches.map((match) => (
                <div
                key={match.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div className="d-flex align-items-center justify-content-end w-50">
                  <span className="me-2 text-end">
                    {match.player1_display && match.player1_alias
                      ? `${match.player1_display} como ${match.player1_alias}`
                      : "Desconhecido"}
                  </span>
                  <strong className="badge bg-primary me-2">
                    {match.score_player1 !== null ? match.score_player1 : "-"}
                  </strong>
                </div>
                <span className="text-center mx-2">X</span>
                <div className="d-flex align-items-center justify-content-start w-50">
                  <strong className="badge bg-primary ms-2">
                    {match.score_player2 !== null ? match.score_player2 : "-"}
                  </strong>
                  <span className="ms-2 text-start">
                    {match.player2_display && match.player2_alias
                      ? `${match.player2_display} como ${match.player2_alias}`
                      : "Desconhecido"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center">Nenhuma partida registrada.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentDetails;

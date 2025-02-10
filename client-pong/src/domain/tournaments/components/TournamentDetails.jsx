import React from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import API_BASE_URL from "../../../assets/config/config";
import { useWebSocket } from "../../webSocket/WebSocketProvider";

const TournamentDetails = ({
  selectedTournament,
  participants,
  matches,
  setSelectedTournament,
}) => {
  const { wsSendNotification } = useWebSocket();

  const getAuthDetails = () => ({
    accessToken: localStorage.getItem("access"),
    loggedID: parseInt(localStorage.getItem("id"), 10),
  });

  if (!selectedTournament) {
    return <p>Erro: Torneio não encontrado.</p>;
  }

  const { tournament } = selectedTournament;

  const formatDate = (dateString) => {
    const optionsDate = { day: "2-digit", month: "2-digit", year: "numeric" };
    const optionsTime = { hour: "2-digit", minute: "2-digit" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("pt-BR", optionsDate),
      time: date.toLocaleTimeString("pt-BR", optionsTime),
    };
  };

  // Não reordenamos os participantes; eles são usados conforme chegam.
  // Ordena os matches pelo id (ascendente) no front.
  const sortedMatches = [...matches].sort((a, b) => a.id - b.id);

  const { loggedID, accessToken } = getAuthDetails();

  // O próximo match pendente é aquele cujo status seja "pending"
  const pendingMatches = sortedMatches.filter((match) => match.status === "pending");
  const nextMatch = pendingMatches.length > 0 ? pendingMatches[0] : null;
  console.log(tournament);

  // Caso o torneio esteja concluído, procuramos o campeão
  let championBanner = null;
  if (tournament.status === "completed" && tournament.winner) {
    // Procura no array de participantes aquele cujo user.id seja o winner_id
    const championParticipant = participants.find(
      (participant) => participant.user && participant.user.id === tournament.winner
    );
    if (championParticipant) {
      championBanner = (
        <div
          className="alert alert-success text-center"
          style={{ fontSize: "1.5em", fontWeight: "bold" }}
        >
          Campeão: {championParticipant.user.display_name}
        </div>
      );
    }
  }

  // Função que chama o endpoint 'challenge-user/' para iniciar o desafio do torneio.
  const handleChallengeClick = async () => {
    if (!nextMatch) {
      alert("Não há partida pendente.");
      return;
    }
    // Verifica se o usuário logado faz parte da próxima partida.
    // Assume-se que nextMatch.player1 e nextMatch.player2 contenham os IDs dos participantes.
    if (nextMatch.player1_id !== loggedID && nextMatch.player2_id !== loggedID) {
      alert("Você não está na próxima partida.");
      return;
    }
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/game/challenge-user/`,
        { tournament_id: tournament.id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const { match_id, message } = response.data;
      if (!match_id) {
        alert("Erro ao registrar o desafio do torneio. Tente novamente.");
        return;
      }
      alert(message);
    } catch (error) {
      console.error("Erro ao desafiar no torneio:", error.response?.data || error);
      alert(error.response?.data?.error || "Erro ao desafiar no torneio.");
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
        <h3>Informações do Torneio</h3>
        <div>
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedTournament(null)}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Voltar à Lista
          </button>
        </div>
      </div>
      <div className="card-body">
        {/* Se o torneio estiver concluído, exibe o banner do campeão */}
        {championBanner}
        {/* O botão "Desafiar" aparece para todos; caso o usuário não esteja na próxima partida,
            o endpoint retornará o erro "Você não está na próxima partida." */}
        {!tournament.winner && (
          <button
            title="Desafiar"
            style={{ margin: "5px" }}
            onClick={handleChallengeClick}
          >
            🎮 Iniciar Próxima Partida
          </button>
        )}
        <p>
          <strong>Nome:</strong> {tournament?.name || "Não disponível"}
        </p>
        <p>
          <strong>Status:</strong> {tournament?.status || "Não disponível"}
        </p>
        <p>
          <strong>Data de Criação:</strong>{" "}
          {tournament?.created_at
            ? `${formatDate(tournament.created_at).date} às ${formatDate(
                tournament.created_at
              ).time}`
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
            {participants.length > 0 ? (
              participants.map((participant, index) => (
                <tr key={participant.id}>
                  <td>{index + 1}</td>
                  <td>
                    {participant.user?.display_name || "Usuário desconhecido"}
                  </td>
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
          {sortedMatches.length > 0 ? (
            sortedMatches.map((match) => (
              <div
                key={match.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div className="d-flex align-items-center justify-content-end w-50">
                  <span className="me-2 text-end">
                    {match.player1_display || "Desconhecido"}
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
                    {match.player2_display || "Desconhecido"}
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

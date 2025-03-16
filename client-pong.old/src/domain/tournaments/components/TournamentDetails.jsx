import React from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import API_BASE_URL from "../../../assets/config/config";
import { useWebSocket } from "../../webSocket/WebSocketProvider";
import { useTranslation } from "react-i18next";

const TournamentDetails = ({
  selectedTournament,
  participants,
  matches,
  setSelectedTournament,
}) => {
  const { wsSendNotification } = useWebSocket();
  const { t } = useTranslation();

  const getAuthDetails = () => ({
    accessToken: localStorage.getItem("access"),
    loggedID: parseInt(localStorage.getItem("id"), 10),
  });

  if (!selectedTournament) {
    return <p>{t("tournament.error_not_found")}</p>;
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

  const sortedMatches = [...matches].sort((a, b) => a.id - b.id);
  const { loggedID, accessToken } = getAuthDetails();
  const pendingMatches = sortedMatches.filter((match) => match.status === "pending");
  const nextMatch = pendingMatches.length > 0 ? pendingMatches[0] : null;
  console.log(tournament);

  let championBanner = null;
  if (tournament.status === "completed" && tournament.winner) {
    const championParticipant = participants.find(
      (participant) => participant.user && participant.user.id === tournament.winner
    );
    if (championParticipant) {
      championBanner = (
        <div
          className="alert alert-success text-center"
          style={{ fontSize: "1.5em", fontWeight: "bold" }}
        >
          {t("tournament.champion")}: {championParticipant.user.display_name}
        </div>
      );
    }
  }

  const handleChallengeClick = async () => {
    if (!nextMatch) {
      alert(t("tournament.no_pending_match"));
      return;
    }
    if (nextMatch.player1_id !== loggedID && nextMatch.player2_id !== loggedID) {
      alert(t("toast.not_in_next_match"));
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
        alert(t("tournament.challenge_error"));
        return;
      }
      alert(message);
    } catch (error) {
      console.error("Erro ao desafiar no torneio:", error.response?.data || error);
      alert(error.response?.data?.error || t("tournament.challenge_failure"));
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
        <h3>{t("tournament.details_header")}</h3>
        <div>
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedTournament(null)}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> {t("tournament.back_to_list")}
          </button>
        </div>
      </div>
      <div className="card-body">
        {championBanner}
        {!tournament.winner && (
          <button
            title={t("tournament.challenge")}
            style={{ margin: "5px" }}
            onClick={handleChallengeClick}
          >
            🎮 {t("tournament.start_next_match")}
          </button>
        )}
        <p>
          <strong>{t("tournament.name")}:</strong> {tournament?.name || t("tournament.not_available")}
        </p>
        <p>
          <strong>{t("tournament.status")}:</strong> {tournament?.status || t("tournament.not_available")}
        </p>
        <p>
          <strong>{t("tournament.creation_date")}:</strong>{" "}
          {tournament?.created_at
            ? `${formatDate(tournament.created_at).date} ${t("tournament.at")} ${formatDate(tournament.created_at).time}`
            : t("tournament.not_available")}
        </p>
        <p>
          <strong>{t("tournament.total_participants")}:</strong> {participants.length || 0}
        </p>

        <h4 className="mt-4">{t("tournament.participants")}</h4>
        <table className="table">
          <thead>
            <tr>
              <th>{t("tournament.table.index")}</th>
              <th>{t("tournament.table.participant")}</th>
              <th>{t("tournament.table.alias")}</th>
              <th>{t("tournament.table.points")}</th>
              <th>{t("tournament.table.registration_date")}</th>
            </tr>
          </thead>
          <tbody>
            {participants.length > 0 ? (
              participants.map((participant, index) => (
                <tr key={participant.id}>
                  <td>{index + 1}</td>
                  <td>{participant.user?.display_name || t("tournament.unknown")}</td>
                  <td>{participant.alias}</td>
                  <td>
                    {participant.points} {t("tournament.points")}
                  </td>
                  <td>
                    {formatDate(participant.registered_at).date} {t("tournament.at")}{" "}
                    {formatDate(participant.registered_at).time}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  {t("tournament.no_participants_registered")}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h4>{t("tournament.matches")}</h4>
        <div className="list-group">
          {sortedMatches.length > 0 ? (
            sortedMatches.map((match) => (
              <div
                key={match.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div className="d-flex align-items-center justify-content-end w-50">
                  <span className="me-2 text-end">
                    {match.player1_display || t("tournament.unknown")}
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
                    {match.player2_display || t("tournament.unknown")}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center">{t("tournament.no_matches_registered")}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentDetails;

import React, { useState, useEffect } from "react";
import Navbar from "../template/Navbar";
import TournamentTable from "./components/TournamentTable";
import TournamentDetails from "./components/TournamentDetails";
import { useTournaments } from "./hooks/useTournaments.js";
import "../../assets/styles/tournament.css";
import { useWebSocket } from "../webSocket/WebSocketProvider.jsx";

const Tournaments = () => {
  const { wsSendNotification, notifications } = useWebSocket();

  const {
    tournaments,
    selectedTournament,
    participants,
    matches,
    filter,
    error,
    setFilter,
    setSelectedTournament,
    handleViewTournament,
    handleCreateTournament,
    handleRegister,
    handleStartTournament,
  } = useTournaments({
    notifications, // Passa as notificações do WebSocket
    wsSendNotification, // Passa a função para enviar notificações
  });

  const [aliases, setAliases] = useState({});
  const [expandedTournament, setExpandedTournament] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Recupera o currentUserId do localStorage
  useEffect(() => {
    const userId = localStorage.getItem("id"); // Certifique-se de que "id" é o nome da chave no localStorage
    if (userId) {
      setCurrentUserId(parseInt(userId, 10));
    }
  }, []);

  const renderParticipants = () =>
    participants.map((participant) => (
      <li key={participant.id}>
        {participant.alias} - {participant.points}
      </li>
    ));

  const renderMatches = () =>
    matches.map((match) => (
      <div key={match.id}>
        {match.player1_display} x {match.player2_display}
      </div>
    ));

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        {error && <div className="alert alert-danger">{error}</div>}

        {!selectedTournament && (
          <TournamentTable
            tournaments={tournaments}
            currentUserId={currentUserId}
            filter={filter}
            setFilter={setFilter}
            setExpandedTournament={setExpandedTournament}
            expandedTournament={expandedTournament}
            aliases={aliases}
            setAliases={setAliases}
            handleViewTournament={handleViewTournament}
            handleCreateTournament={handleCreateTournament}
            handleRegister={handleRegister}
            handleStartTournament={handleStartTournament}
            setSelectedTournament={setSelectedTournament}
          />
        )}

        {selectedTournament && (
          <TournamentDetails
            selectedTournament={selectedTournament}
            participants={participants}
            matches={matches}
            renderParticipants={renderParticipants}
            renderMatches={renderMatches}
            setSelectedTournament={setSelectedTournament}
          />
        )}
      </div>
    </>
  );
};

export default Tournaments;

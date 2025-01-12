import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../template/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faDoorOpen, faArrowLeft, faTrophy } from "@fortawesome/free-solid-svg-icons";
import API_BASE_URL from "../../assets/config/config";

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentAlias, setNewTournamentAlias] = useState("");
  const [filter, setFilter] = useState("all");
  const [aliases, setAliases] = useState({});
  const [expandedTournament, setExpandedTournament] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      setError("Access token não encontrado.");
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/game/tournaments/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const sortedTournaments = response.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setTournaments(sortedTournaments);
    } catch (error) {
      console.error(error);
      setError("Erro ao carregar torneios.");
    }
  };

  const handleCreateTournament = async () => {
    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      setError("Access token não encontrado.");
      return;
    }

    if (!newTournamentName || !newTournamentAlias) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/game/tournaments/create/`,
        { name: newTournamentName, alias: newTournamentAlias },
        {
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        }
      );
      setTournaments([response.data.tournament, ...tournaments]);
      setNewTournamentName("");
      setNewTournamentAlias("");
      setShowCreateForm(false);
      alert("Torneio criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar torneio:", error.response?.data || error.message);
      if (error.response?.status === 400) {
        alert(`Erro: ${error.response.data.error}`);
      } else {
        alert("Erro ao criar torneio. Tente novamente mais tarde.");
      }
    }
  };

  const handleRegister = async (tournamentId) => {
    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      setError("Access token não encontrado.");
      return;
    }

    const alias = aliases[tournamentId]?.trim();

    if (!alias) {
      alert("O campo 'alias' é obrigatório para se inscrever.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/game/tournaments/${tournamentId}/register/`,
        { alias },
        {
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        }
      );
      alert("Inscrição realizada com sucesso!");
      fetchTournaments();
      setExpandedTournament(null);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.error || "Erro ao registrar no torneio.");
    }
  };

  const handleViewTournament = async (tournamentId) => {
    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      setError("Access token não encontrado.");
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/game/tournaments/${tournamentId}/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setSelectedTournament(response.data);
      setParticipants(response.data.participants || []);
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error(error);
      setError("Erro ao buscar detalhes do torneio.");
    }
  };

  const renderParticipants = () => {
    const sortedParticipants = [...participants].sort((a, b) => b.points - a.points);
    return sortedParticipants.map((participant, index) => (
      <li
        key={participant.id}
        className={`list-group-item ${
          index === 0 && selectedTournament.status === "completed" ? "bg-warning font-weight-bold" : ""
        }`}
      >
        {participant.alias} - {participant.points} pontos
        {index === 0 && selectedTournament.status === "completed" && (
          <FontAwesomeIcon icon={faTrophy} className="ms-2 text-dark" />
        )}
      </li>
    ));
  };

  const renderMatches = () => {
    if (matches.length === 0) return <p>Nenhuma partida registrada.</p>;
    return matches.map((match) => (
      <div key={match.id} className="list-group-item d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center justify-content-end w-50">
          <span className="me-2 text-end">{match.player1_display || "Desconhecido"}</span>
          <strong className="badge bg-primary me-2">{match.score_player1}</strong>
        </div>
        <span className="text-center mx-2">X</span>
        <div className="d-flex align-items-center justify-content-start w-50">
          <strong className="badge bg-primary ms-2">{match.score_player2}</strong>
          <span className="ms-2 text-start">{match.player2_display || "Desconhecido"}</span>
        </div>
      </div>
    ));
  };

  const filteredTournaments = tournaments.filter((tournament) =>
    filter === "all" ? true : tournament.status === filter
  );

  return (
    <>
      <Navbar />
      <div className="container mt-5" style={{ maxWidth: "900px" }}>
        <h1 className="text-center">Torneios</h1>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!selectedTournament && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                {["all", "planned", "ongoing", "completed"].map((status) => (
                  <button
                    key={status}
                    className={`btn btn-sm me-2 ${
                      filter === status ? "btn-primary" : "btn-outline-primary"
                    }`}
                    onClick={() => setFilter(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-success d-flex align-items-center"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" /> Novo Torneio
              </button>
            </div>

            {showCreateForm && (
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Nome do torneio"
                    value={newTournamentName}
                    onChange={(e) => setNewTournamentName(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Seu alias no torneio"
                    value={newTournamentAlias}
                    onChange={(e) => setNewTournamentAlias(e.target.value)}
                  />
                  <button className="btn btn-primary w-100" onClick={handleCreateTournament}>
                    Criar Torneio
                  </button>
                </div>
              </div>
            )}

            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Criado por</th>
                  <th>Data de Criação</th>
                  <th>Participantes</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTournaments.map((tournament) => (
                  <>
                    <tr key={tournament.id}>
                      <td>{tournament.name}</td>
                      <td>{tournament.creator_display_name || "Desconhecido"}</td>
                      <td>{tournament.created_at}</td>
                      <td>{tournament.total_participants}</td>
                      <td>{tournament.status}</td>
                      <td>
                        {tournament.status === "planned" && !tournament.user_registered && (
                          <FontAwesomeIcon
                            icon={faDoorOpen}
                            className="text-success cursor-pointer"
                            onClick={() => setExpandedTournament(tournament.id)}
                            style={{
                              cursor: "pointer",
                              fontSize: "1.5em",
                              transition: "transform 0.2s",
                            }}
                            onMouseEnter={(e) => (e.target.style.transform = "scale(1.2)")}
                            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                          />
                        )}
                        {tournament.user_registered && (
                          <span className="badge bg-success text-white">
                            Inscrito como {tournament.user_alias}
                          </span>
                        )}
                      </td>
                    </tr>
                    {expandedTournament === tournament.id && (
                      <tr>
                        <td colSpan="6">
                          <div className="p-3 bg-light">
                            <input
                              type="text"
                              placeholder="Digite seu alias"
                              className="form-control mb-2"
                              value={aliases[tournament.id] || ""}
                              onChange={(e) =>
                                setAliases({ ...aliases, [tournament.id]: e.target.value })
                              }
                            />
                            <button
                              className="btn btn-success"
                              onClick={() => handleRegister(tournament.id)}
                            >
                              Confirmar Inscrição
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </>
        )}

        {selectedTournament && (
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <h3>{selectedTournament.name}</h3>
              <button className="btn btn-secondary" onClick={() => setSelectedTournament(null)}>
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Voltar à Lista
              </button>
            </div>
            <div className="card-body">
              <p>Filtro Atual: {filter}</p>
              <h4>Participantes</h4>
              <ul className="list-group mb-4">{renderParticipants()}</ul>

              <h4>Partidas</h4>
              <div className="list-group">{renderMatches()}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Tournaments;

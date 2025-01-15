import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDoorOpen, faPlus, faEye, faPlay } from "@fortawesome/free-solid-svg-icons";

const TournamentTable = ({
  tournaments,
  filter,
  setFilter,
  setExpandedTournament,
  expandedTournament,
  aliases,
  setAliases,
  handleRegister,
  handleViewTournament,
  handleStartTournament,
  currentUserId,
  setSelectedTournament,
  handleCreateTournament,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentAlias, setNewTournamentAlias] = useState("");

  // Atualiza console e monitora mudanças no estado de torneios
  useEffect(() => {
    console.log("Torneios atualizados:", tournaments);
  }, [tournaments]);

  const handleFormSubmit = () => {
    if (!newTournamentName || !newTournamentAlias) {
      alert("Preencha todos os campos!");
      return;
    }
    handleCreateTournament(newTournamentName, newTournamentAlias);
    setNewTournamentName("");
    setNewTournamentAlias("");
    setShowCreateForm(false);
  };

  return (
    <div>
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
              placeholder="Nome do Torneio"
              value={newTournamentName}
              onChange={(e) => setNewTournamentName(e.target.value)}
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Seu Alias no Torneio"
              value={newTournamentAlias}
              onChange={(e) => setNewTournamentAlias(e.target.value)}
            />
            <button className="btn btn-primary w-100" onClick={handleFormSubmit}>
              Criar Torneio
            </button>
          </div>
        </div>
      )}
      <table className="table table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>Nome</th>
            <th>Criado por</th>
            <th>Data de Criação</th>
            <th>Participantes</th>
            <th>Status</th>
            <th>Detalhes</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {tournaments
            .filter((tournament) =>
              filter === "all" ? true : tournament.status === filter
            )
            .map((tournament, index) => (
              <React.Fragment key={tournament.id}>
                <tr>
                  <td>{index + 1}</td>
                  <td>{tournament.name}</td>
                  <td>{tournament.creator_display_name || "Desconhecido"}</td>
                  <td>{tournament.created_at}</td>
                  <td>{tournament.total_participants}</td>
                  <td>{tournament.status}</td>
                  <td>
                    <button
                      className="btn btn-link text-decoration-none p-0"
                      onClick={() => handleViewTournament(tournament.id)}
                      title="Ver Detalhes"
                    >
                      <FontAwesomeIcon icon={faEye} className="text-primary" />
                    </button>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      {tournament.status === "planned" && !tournament.user_registered && (
                        <button
                          className="btn btn-warning btn-sm d-flex align-items-center"
                          onClick={() => setExpandedTournament(tournament.id)}
                        >
                          <FontAwesomeIcon icon={faDoorOpen} className="me-1" />
                          Entrar
                        </button>
                      )}
                      {tournament.user_registered && (
                        <span className="badge bg-success text-light">
                          Inscrito como {tournament.user_alias}
                        </span>
                      )}
                      {tournament.status === "planned" &&
                        currentUserId === tournament.creator_id &&
                        tournament.total_participants >= 3 && (
                          <button
                            className="btn btn-warning btn-sm d-flex align-items-center"
                            onClick={() => handleStartTournament(tournament.id)}
                          >
                            <FontAwesomeIcon icon={faPlay} className="me-1" />
                            Iniciar Torneio
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
                {expandedTournament === tournament.id && (
                  <tr>
                    <td colSpan="8">
                      <div className="p-3 bg-light">
                        <input
                          type="text"
                          placeholder="Digite seu alias"
                          className="form-control mb-2"
                          value={aliases[tournament.id] || ""}
                          onChange={(e) => {
                            setAliases((prevAliases) => {
                              const updatedAliases = {
                                ...prevAliases,
                                [tournament.id]: e.target.value,
                              };
                              return updatedAliases;
                            });
                          }}
                        />
                        <button
                          className="btn btn-success"
                          onClick={() => {
                            handleRegister(tournament.id, aliases[tournament.id]);
                            setExpandedTournament(null);
                          }}
                        >
                          Confirmar Inscrição
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
        </tbody>
      </table>

    </div>
  );
};

export default TournamentTable;

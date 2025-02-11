import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDoorOpen, faPlus, faEye, faPlay } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

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
  handleCreateTournament,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentAlias, setNewTournamentAlias] = useState("");

  const { t } = useTranslation();

  // Log de atualização (para depuração)
  useEffect(() => {
    console.log("Torneios atualizados:", tournaments);
  }, [tournaments]);

  const handleFormSubmit = () => {
    if (!newTournamentName || !newTournamentAlias) {
      alert(t("tournament.fill_all_fields"));
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
              {t(`tournament.filter.${status}`)}
            </button>
          ))}
        </div>
        <button
          className="btn btn-success d-flex align-items-center"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <FontAwesomeIcon icon={faPlus} className="me-2" /> {t("tournament.new_tournament")}
        </button>
      </div>

      {showCreateForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <input
              type="text"
              className="form-control mb-2"
              placeholder={t("tournament.tournament_name_placeholder")}
              value={newTournamentName}
              onChange={(e) => setNewTournamentName(e.target.value)}
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder={t("tournament.tournament_alias_placeholder")}
              value={newTournamentAlias}
              onChange={(e) => setNewTournamentAlias(e.target.value)}
            />
            <button className="btn btn-primary w-100" onClick={handleFormSubmit}>
              {t("tournament.create_tournament")}
            </button>
          </div>
        </div>
      )}

      <table className="table table-striped">
        <thead>
          <tr>
            <th>{t("tournament.table.header.index")}</th>
            <th>{t("tournament.table.header.name")}</th>
            <th>{t("tournament.table.header.creator")}</th>
            <th>{t("tournament.table.header.created_at")}</th>
            <th>{t("tournament.table.header.participants")}</th>
            <th>{t("tournament.table.header.status")}</th>
            <th>{t("tournament.table.header.details")}</th>
            <th>{t("tournament.table.header.actions")}</th>
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
                  <td>{tournament.creator_display_name || t("tournament.unknown_creator")}</td>
                  <td>{tournament.created_at}</td>
                  <td>{tournament.total_participants}</td>
                  <td>{tournament.status}</td>
                  <td>
                    <button
                      className="btn btn-link text-decoration-none p-0"
                      onClick={() => handleViewTournament(tournament.id)}
                      title={t("tournament.view_details")}
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
                          {t("tournament.join")}
                        </button>
                      )}
                      {tournament.user_registered && (
                        <span className="badge bg-success text-light">
                          {t("tournament.registered_as")} {tournament.user_alias}
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
                            {t("tournament.start_tournament")}
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
                          placeholder={t("tournament.alias_placeholder")}
                          className="form-control mb-2"
                          value={aliases[tournament.id] || ""}
                          onChange={(e) =>
                            setAliases((prevAliases) => ({
                              ...prevAliases,
                              [tournament.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          className="btn btn-success"
                          onClick={() => {
                            handleRegister(tournament.id, aliases[tournament.id]);
                            setExpandedTournament(null);
                          }}
                        >
                          {t("tournament.confirm_registration")}
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

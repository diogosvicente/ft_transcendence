import React from "react";
import Navbar from "../template/Navbar";
import useFetchRankings from "./hooks/useFetchRankings";
import "../../assets/styles/ranking.css";
import API_BASE_URL from "../../assets/config/config";

const Ranking = () => {
  const { tournamentRanking, victoriesRanking, error } = useFetchRankings();

  const renderRankingList = (ranking, title, type) => (
    <div className={`ranking-section ${type}`}>
      <h2 className="ranking-title">{title}</h2>
      {ranking.length > 0 ? (
        <ul className="ranking-list">
          {ranking.map((user, index) => {
            const defaultAvatar = `${API_BASE_URL}/media/avatars/default.png`;
            const avatarUrl = user.avatar
              ? `${API_BASE_URL}${user.avatar}`
              : defaultAvatar;

            return (
              <li key={user.id} className={`ranking-item rank-${index + 1}`}>
                <div className="ranking-avatar-container">
                  <img
                    src={avatarUrl}
                    alt={user.display_name}
                    className="ranking-avatar"
                  />
                </div>
                <div className="ranking-details">
                  <span className="ranking-number">
                    {index + 1 === 1
                      ? "🏆"
                      : index + 1 === 2
                      ? "🥈"
                      : index + 1 === 3
                      ? "🥉"
                      : index + 1}
                  </span>
                  <span className="ranking-name">{user.display_name}</span>
                  <div className="ranking-stats">
                    {type === "tournament" ? (
                      <>
                        <span>{user.tournaments_won} torneio {user.tournaments_won > 1 ? "s" : ""}</span>
                        <span>vencido{user.tournaments_won > 1 ? "s" : ""}</span>
                      </>
                    ) : (
                      <>
                        <span>{user.wins} vitória{user.wins > 1 ? "s" : ""}</span>
                        <span>({user.losses} derrota{user.losses > 1 ? "s" : ""})</span>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="no-data">Nenhum dado disponível.</p>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="ranking-container">
        {error ? (
          <p className="text-danger">{error}</p>
        ) : (
          <div className="ranking-content">
            {renderRankingList(
              tournamentRanking,
              "Mais Torneios Vencidos",
              "tournament"
            )}
            {renderRankingList(
              victoriesRanking,
              "Mais Vitórias",
              "victories"
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Ranking;

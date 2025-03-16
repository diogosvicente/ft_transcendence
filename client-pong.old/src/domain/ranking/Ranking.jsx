import React from "react";
import Navbar from "../template/Navbar";
import useFetchRankings from "./hooks/useFetchRankings";
import "../../assets/styles/ranking.css";
import API_BASE_URL from "../../assets/config/config";
import { useTranslation } from "react-i18next";

const Ranking = () => {
  const { t } = useTranslation();
  const { tournamentRanking, victoriesRanking, error } = useFetchRankings();

  const renderRankingList = (ranking, title, type) => (
    <div className={`ranking-section ${type}`}>
      <h2 className="ranking-title">{t(title)}</h2>
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
                        <span>
                          {user.tournaments_won}{" "}
                          {t("ranking.tournament", { count: user.tournaments_won })}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          {user.wins} {t("ranking.victory", { count: user.wins })}
                        </span>
                        <span>
                          ({user.losses} {t("ranking.defeat", { count: user.losses })})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="no-data">{t("ranking.no_data")}</p>
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
              "ranking.most_tournaments_won",
              "tournament"
            )}
            {renderRankingList(
              victoriesRanking,
              "ranking.most_victories",
              "victories"
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Ranking;

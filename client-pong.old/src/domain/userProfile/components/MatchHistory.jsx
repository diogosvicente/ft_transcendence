import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useFetchMatchHistory from "../hooks/useFetchMatchHistory";

const MatchHistory = () => {
  const { t, i18n } = useTranslation();
  const { user_id } = useParams();
  const { matchHistory, error } = useFetchMatchHistory(user_id);

  // Mapeamento para garantir que o locale seja válido
  const localeMap = {
    "en": "en-US",
    "es": "es-ES",
    "pt": "pt-BR",
    "pt-BR": "pt-BR",
    "en-US": "en-US",
    "es-ES": "es-ES"
  };

  // Define um idioma padrão seguro
  const currentLang = localeMap[i18n.language] || "pt-BR";

  const formatDateTime = (dateString) => {
    if (!dateString) return t("match_history.not_played");

    const optionsDate = { day: "2-digit", month: "2-digit", year: "numeric" };
    const optionsTime = { hour: "2-digit", minute: "2-digit" };
    const date = new Date(dateString);

    return `${date.toLocaleDateString(currentLang, optionsDate)} ${t("match_history.at")} ${date.toLocaleTimeString(currentLang, optionsTime)}`;
  };

  // Mapeamento para garantir que os valores sejam traduzidos corretamente
  const resultMap = {
    "Vitória": "match_history.victory",
    "Derrota": "match_history.defeat"
  };

  const sortedMatches = [...matchHistory].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <div className="match-history">
      <h2>{t("match_history.title")}</h2>
      {error ? (
        <p className="text-danger">{t("match_history.error")}: {error}</p>
      ) : sortedMatches.length > 0 ? (
        <table className="table table-striped match-history-table">
          <thead>
            <tr>
              <th>{t("match_history.date")}</th>
              <th>{t("match_history.opponent")}</th>
              <th>{t("match_history.result")}</th>
              <th>{t("match_history.score")}</th>
              <th>{t("match_history.type")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedMatches.map((match) => {
              // Define a classe de cor baseada no resultado ORIGINAL
              const rowClass = match.result === "Vitória" ? "table-success" : "table-danger";

              return (
                <tr key={match.id} className={rowClass}>
                  <td>{formatDateTime(match.date)}</td>
                  <td>
                    {`${match.opponent_display_name}${
                      match.opponent_alias ? ` ${t("match_history.as")} ${match.opponent_alias}` : ""
                    }`}
                  </td>
                  <td>{t(resultMap[match.result] || "match_history.not_played")}</td>
                  <td>{`${match.score.player1 ?? "-"} - ${match.score.player2 ?? "-"}`}</td>
                  <td>
                    {match.tournament_name
                      ? `${t("match_history.tournament")}: ${match.tournament_name}`
                      : "1vs1"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>{t("match_history.no_matches")}</p>
      )}
    </div>
  );
};

export default MatchHistory;

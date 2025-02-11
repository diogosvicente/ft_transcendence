import React from "react";
import { useTranslation } from "react-i18next";

const ProfileInfo = ({ user, totalMatches, winRate }) => {
  const { t } = useTranslation();

  return (
    <div className="profile-info">
      <h2>{t("profile.statistics")}</h2>
      <p>{t("profile.total_matches")}: {totalMatches}</p>
      <p>{t("profile.wins")}: {user.wins || 0}</p>
      <p>{t("profile.losses")}: {user.losses || 0}</p>
      <p>{t("profile.win_rate")}: {winRate}%</p>
    </div>
  );
};

export default ProfileInfo;

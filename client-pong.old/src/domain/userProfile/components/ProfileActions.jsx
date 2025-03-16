import React from "react";
import { useTranslation } from "react-i18next";

const ProfileActions = ({ isOwnProfile }) => {
  const { t } = useTranslation();

  return (
    <div className="profile-actions">
      {isOwnProfile ? (
        <button
          title={t("profile.edit_info")}
          onClick={() => (window.location.href = "/edit-profile")}
          style={{ marginBottom: "10px" }}
        >
          ✏️ {t("profile.edit_info")}
        </button>
      ) : null}
    </div>
  );
};

export default ProfileActions;

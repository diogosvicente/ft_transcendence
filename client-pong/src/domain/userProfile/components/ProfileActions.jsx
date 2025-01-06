import React from "react";

const ProfileActions = ({
  isOwnProfile,
}) => {
  return (
    <div className="profile-actions">
      {isOwnProfile ? (
        <button
          title="Editar Minhas Informações"
          onClick={() => (window.location.href = "/edit-profile")}
          style={{ marginBottom: "10px" }}
        >
          ✏️ Editar Minhas Informações
        </button>
      ) : "" }
    </div>
  );
};

export default ProfileActions;

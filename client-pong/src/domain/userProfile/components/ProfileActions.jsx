import React from "react";

const ProfileActions = ({
  user_id,
  friendshipId,
  friendshipStatus,
  isBlocked,
  blockerId,
  loggedUserId,
  inviterFriendId,
  receiverFriendId,
  isOwnProfile,
  blockedRecordId,
  handleAddFriend,
  handleCancelRequest,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  handleRemoveFriend,
  handleBlockUser,
  handleUnblockUser,
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
      ) : (
        !isBlocked && (
          friendshipId ? (
            friendshipStatus === "pending" ? (
              loggedUserId === String(inviterFriendId) ? (
                <div>
                  <button
                    title="Cancelar Solicitação"
                    onClick={handleCancelRequest}
                    style={{ marginRight: "10px" }}
                  >
                    ❌ Cancelar Solicitação ⏳
                  </button>
                  <button
                    title="Bloquear Usuário"
                    onClick={handleBlockUser}
                    style={{ marginRight: "10px" }}
                  >
                    🚫 Bloquear
                  </button>
                  <button
                    title="Desafiar para Jogo"
                    onClick={handleBlockUser}
                  >
                    🎮 Desafiar
                  </button>
                </div>
              ) : loggedUserId === String(receiverFriendId) ? (
                <div>
                  <button
                    title="Aceitar Solicitação"
                    onClick={handleAcceptFriendRequest}
                    style={{ marginRight: "10px" }}
                  >
                    ✔ Aceitar
                  </button>
                  <button
                    title="Rejeitar Solicitação"
                    onClick={handleRejectFriendRequest}
                    style={{ marginRight: "10px" }}
                  >
                    ❌ Rejeitar
                  </button>
                  <button
                    title="Bloquear Usuário"
                    onClick={handleBlockUser}
                    style={{ marginRight: "10px" }}
                  >
                    🚫 Bloquear
                  </button>
                  <button
                    title="Desafiar para Jogo"
                    onClick={handleBlockUser}
                  >
                    🎮 Desafiar
                  </button>
                </div>
              ) : null
            ) : (
              <div>
                <button
                  title="Remover Amigo"
                  onClick={handleRemoveFriend}
                  style={{ marginRight: "10px" }}
                >
                  ❌ Remover Amigo
                </button>
                <button
                  title="Bloquear Usuário"
                  onClick={handleBlockUser}
                  style={{ marginRight: "10px" }}
                >
                  🚫 Bloquear
                </button>
                <button
                  title="Desafiar para Jogo"
                  onClick={handleBlockUser}
                >
                  🎮 Desafiar
                </button>
              </div>
            )
          ) : (
            <>
              <button
                title="Adicionar Amigo"
                onClick={handleAddFriend}
                style={{ marginRight: "10px" }}
              >
                ➕ Adicionar Amigo
              </button>
              <button
                title="Bloquear Usuário"
                onClick={handleBlockUser}
                style={{ marginRight: "10px" }}
              >
                🚫 Bloquear
              </button>
              <button
                title="Desafiar para Jogo"
                onClick={handleBlockUser}
              >
                🎮 Desafiar
              </button>
            </>
          )
        )
      )}
      {isBlocked && loggedUserId === String(blockerId) && (
        <button title="Desbloquear Usuário" onClick={handleUnblockUser}>
          🔓 Desbloquear
        </button>
      )}
    </div>
  );
};

export default ProfileActions;

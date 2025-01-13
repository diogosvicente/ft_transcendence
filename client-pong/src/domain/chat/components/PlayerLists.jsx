import React from "react";
import "../../../assets/styles/friendList.css";

const PlayerLists = ({
  friends,
  pendingRequests,
  blockedUsers,
  nonFriends,
  openChatWithUser,
  addFriend,
  blockUser,
  unblockUser,
  removeFriend,
  challengeUser,
  acceptFriendRequest,
  rejectFriendRequest,
}) => {
  return (
    <div className="players-list">
      <h3>Lista de Jogadores</h3>

      {/* Amigos */}
      <div className="friends-section">
        <h4>Amigos</h4>
        {friends.length > 0 ? (
          <ul>
            {friends.map((friend) => (
              <li key={friend.id} className="player-item">
                <div className="player-header">
                  <img src={friend.avatar} alt={friend.display_name} className="player-avatar" />
                  <div className="player-details">
                    <p className="player-name">{friend.display_name}</p>
                    <p className="player-status">
                      <span className={`status-dot ${friend.online_status ? "online" : "offline"}`}></span>
                      {friend.online_status ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="player-actions">
                  <button
                    title="Abrir Chat Privado"
                    onClick={() => openChatWithUser(friend)} // Chama o método passando o amigo
                    style={{ margin: "5px" }}
                  >
                    💬
                  </button>
                  <button
                    title="Ver Perfil"
                    onClick={() => window.open(`/user-profile/${friend.user_id}`, "_blank")}
                    style={{ margin: "5px" }}
                  >
                    👤
                  </button>
                  <button
                    title="Desafiar"
                    style={{ margin: "5px" }}
                    onClick={() => alert("Desafiar usuário ainda não implementado.")}
                  >
                    🎮
                  </button>
                  <button title="Bloquear" onClick={() => blockUser(friend.user_id)} style={{ margin: "5px" }}>
                    🚫
                  </button>
                  <button title="Excluir" onClick={() => removeFriend(friend.id)} style={{ margin: "5px" }}>
                    ❌
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Sem amigos adicionados.</p>
        )}
      </div>

      {/* Solicitações Pendentes */}
      <div className="pending-section">
        <h4>Solicitações Pendentes</h4>
        {pendingRequests.length > 0 ? (
          <ul>
            {pendingRequests.map((request) => (
              <li key={request.id} className="player-item">
                <img src={request.avatar} alt={request.display_name} className="player-avatar" />
                <div className="player-info">
                  <p className="player-name">{request.display_name}</p>
                  <p className="player-status">
                    {request.direction === "received" ? "Recebida" : "Enviada"}
                  </p>
                </div>
                <div className="player-actions">
                  {request.direction === "received" ? (
                    <>
                      <button title="Aceitar" onClick={() => acceptFriendRequest(request.id)}>✔</button>
                      <button title="Rejeitar" onClick={() => rejectFriendRequest(request.id)}>❌</button>
                    </>
                  ) : (
                    <button title="Cancelar Solicitação" onClick={() => rejectFriendRequest(request.id)}>❌</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Sem solicitações pendentes.</p>
        )}
      </div>

      {/* Usuários Bloqueados */}
      <div className="blocked-section">
        <h4>Usuários Bloqueados</h4>
        {blockedUsers.length > 0 ? (
          <ul>
            {blockedUsers.map((user) => (
              <li key={user.blocked_record_id} className="player-item">
                <img src={user.avatar} alt={user.display_name} className="player-avatar" />
                <div className="player-info">
                  <p className="player-name">{user.display_name}</p>
                  <p className="player-status">Bloqueado</p>
                </div>
                <div className="player-actions">
                  <button title="Desbloquear" onClick={() => unblockUser(user.blocked_record_id)}>🔓</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum usuário bloqueado.</p>
        )}
      </div>

      {/* Não Amigos */}
      <div className="non-friends-section">
        <h4>Não Amigos</h4>
        {nonFriends.length > 0 ? (
          <ul>
            {nonFriends.map((user) => (
              <li key={user.id} className="player-item">
                <img src={user.avatar} alt={user.display_name} className="player-avatar" />
                <div className="player-info">
                  <p className="player-name">{user.display_name}</p>
                  <p className="player-status">
                  <span
                    className={`status-dot ${user.online_status ? "online" : "offline"}`}
                    style={{
                      display: "inline-block",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      marginRight: "5px",
                      backgroundColor: user.online_status ? "green" : "red",
                    }}
                  ></span>
                  {user.online_status ? "Online" : "Offline"}
                </p>

                </div>
                <div className="player-actions">
                  <button title="Ver Perfil" onClick={() => window.open(`/user-profile/${user.id}`, "_blank")}>
                    👤
                  </button>
                  <button title="Adicionar como amigo" onClick={() => addFriend(user.id)}>➕</button>
                  <button title="Bloquear" onClick={() => blockUser(user.id)}>🚫</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Não há usuários disponíveis para adicionar.</p>
        )}
      </div>
    </div>
  );
};

export default PlayerLists;

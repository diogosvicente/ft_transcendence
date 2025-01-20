import React, { useState } from "react";
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
  const [expandedSections, setExpandedSections] = useState({
    friends: true,
    pendingRequests: true,
    blockedUsers: true,
    nonFriends: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="players-list">
      <h3>Lista de Jogadores</h3>

      {/* Amigos */}
      <div className="accordion-section">
        <h4 onClick={() => toggleSection("friends")} className="accordion-header">
          Amigos {expandedSections.friends ? "▼" : "▶"}
        </h4>
        {expandedSections.friends && (
          <div className="accordion-content">
            {friends.length > 0 ? (
              <ul>
                {friends.map((friend) => (
                  <li key={friend.id} className="player-item">
                    <div className="player-header">
                      <img
                        src={friend.avatar}
                        alt={friend.display_name}
                        className="player-avatar"
                      />
                      <div className="player-details">
                        <p className="player-name">{friend.display_name}</p>
                        <p className="player-status">
                          <span
                            className={`status-dot ${
                              friend.online_status ? "online" : "offline"
                            }`}
                          ></span>
                          {friend.online_status ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="player-actions">
                      <button
                        title="Abrir Chat Privado"
                        onClick={() => openChatWithUser(friend)}
                        style={{ margin: "5px" }}
                      >
                        💬
                      </button>
                      <button
                        title="Ver Perfil"
                        onClick={() =>
                          window.open(`/user-profile/${friend.user_id}`, "_blank")
                        }
                        style={{ margin: "5px" }}
                      >
                        👤
                      </button>
                      <button
                        title="Desafiar"
                        style={{ margin: "5px" }}
                        onClick={() => challengeUser(friend.user_id)}
                      >
                        🎮
                      </button>
                      <button
                        title="Bloquear"
                        onClick={() => blockUser(friend.user_id)}
                        style={{ margin: "5px" }}
                      >
                        🚫
                      </button>
                      <button
                        title="Excluir"
                        onClick={() => removeFriend(friend.id)}
                        style={{ margin: "5px" }}
                      >
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
        )}
      </div>

      {/* Solicitações Pendentes */}
      <div className="accordion-section">
        <h4
          onClick={() => toggleSection("pendingRequests")}
          className="accordion-header"
        >
          Solicitações Pendentes {expandedSections.pendingRequests ? "▼" : "▶"}
        </h4>
        {expandedSections.pendingRequests && (
          <div className="accordion-content">
            {pendingRequests.length > 0 ? (
              <ul>
                {pendingRequests.map((request) => (
                  <li key={request.id} className="player-item">
                    <div className="player-header">
                      <img
                        src={request.avatar}
                        alt={request.display_name}
                        className="player-avatar"
                      />
                      <div className="player-details">
                        <p className="player-name">{request.display_name}</p>
                        <p className="player-status">
                          {request.direction === "received" ? "Recebida" : "Enviada"}
                        </p>
                      </div>
                    </div>
                    <div className="player-actions">
                      {request.direction === "received" ? (
                        <>
                          <button
                            title="Aceitar"
                            onClick={() => acceptFriendRequest(request.id)}
                          >
                            ✔
                          </button>
                          <button
                            title="Rejeitar"
                            onClick={() => rejectFriendRequest(request.id)}
                          >
                            ❌
                          </button>
                        </>
                      ) : (
                        <button
                          title="Cancelar Solicitação"
                          onClick={() => rejectFriendRequest(request.id)}
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Sem solicitações pendentes.</p>
            )}
          </div>
        )}
      </div>

      {/* Usuários Bloqueados */}
      <div className="accordion-section">
        <h4
          onClick={() => toggleSection("blockedUsers")}
          className="accordion-header"
        >
          Usuários Bloqueados {expandedSections.blockedUsers ? "▼" : "▶"}
        </h4>
        {expandedSections.blockedUsers && (
          <div className="accordion-content">
            {blockedUsers.length > 0 ? (
              <ul>
                {blockedUsers.map((user) => (
                  <li key={user.blocked_record_id} className="player-item">
                    <div className="player-header">
                      <img
                        src={user.avatar}
                        alt={user.display_name}
                        className="player-avatar"
                      />
                      <div className="player-details">
                        <p className="player-name">{user.display_name}</p>
                        <p className="player-status">Bloqueado</p>
                      </div>
                    </div>
                    <div className="player-actions">
                      <button
                        title="Desbloquear"
                        onClick={() => unblockUser(user.blocked_record_id)}
                      >
                        🔓
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum usuário bloqueado.</p>
            )}
          </div>
        )}
      </div>

      {/* Não Amigos */}
      <div className="accordion-section">
        <h4
          onClick={() => toggleSection("nonFriends")}
          className="accordion-header"
        >
          Não Amigos {expandedSections.nonFriends ? "▼" : "▶"}
        </h4>
        {expandedSections.nonFriends && (
          <div className="accordion-content">
            {nonFriends.length > 0 ? (
              <ul>
                {nonFriends.map((user) => (
                  <li key={user.id} className="player-item">
                    <div className="player-header">
                      <img
                        src={user.avatar}
                        alt={user.display_name}
                        className="player-avatar"
                      />
                      <div className="player-details">
                        <p className="player-name">{user.display_name}</p>
                        <p className="player-status">
                          <span
                            className={`status-dot ${
                              user.online_status ? "online" : "offline"
                            }`}
                          ></span>
                          {user.online_status ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="player-actions">
                      <button
                        title="Ver Perfil"
                        onClick={() =>
                          window.open(`/user-profile/${user.id}`, "_blank")
                        }
                      >
                        👤
                      </button>
                      <button
                        title="Adicionar como amigo"
                        onClick={() => addFriend(user.id)}
                      >
                        ➕
                      </button>
                      <button
                        title="Bloquear"
                        onClick={() => blockUser(user.id)}
                      >
                        🚫
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Não há usuários disponíveis para adicionar.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerLists;

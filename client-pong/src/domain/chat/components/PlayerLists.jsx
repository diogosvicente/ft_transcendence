import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
  };

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
      <h3>{t("chat.players_list_title")}</h3>

      {/* Amigos */}
      <div className="accordion-section">
        <h4 onClick={() => toggleSection("friends")} className="accordion-header">
          {t("chat.friends")} {expandedSections.friends ? "▼" : "▶"}
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
                          {friend.online_status ? t("chat.online") : t("chat.offline")}
                        </p>
                      </div>
                    </div>
                    <div className="player-actions">
                      <button
                        title={t("chat.open_private_chat")}
                        onClick={() => openChatWithUser(friend)}
                        style={{ margin: "5px" }}
                      >
                        💬
                      </button>
                      <button
                        title={t("chat.view_profile")}
                        onClick={() =>
                          window.open(`/user-profile/${friend.user_id}`, "_blank")
                        }
                        style={{ margin: "5px" }}
                      >
                        👤
                      </button>
                      <button
                        title={t("chat.challenge")}
                        style={{ margin: "5px" }}
                        onClick={() => challengeUser(friend.user_id)}
                      >
                        🎮
                      </button>
                      <button
                        title={t("chat.block")}
                        onClick={() => blockUser(friend.user_id)}
                        style={{ margin: "5px" }}
                      >
                        🚫
                      </button>
                      <button
                        title={t("chat.remove_friend")}
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
              <p>{t("chat.no_friends")}</p>
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
          {t("chat.pending_requests")} {expandedSections.pendingRequests ? "▼" : "▶"}
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
                          {request.direction === "received"
                            ? t("chat.request_received")
                            : t("chat.request_sent")}
                        </p>
                      </div>
                    </div>
                    <div className="player-actions">
                      {request.direction === "received" ? (
                        <>
                          <button
                            title={t("chat.accept_request")}
                            onClick={() => acceptFriendRequest(request.id)}
                          >
                            ✔
                          </button>
                          <button
                            title={t("chat.reject_request")}
                            onClick={() => rejectFriendRequest(request.id)}
                          >
                            ❌
                          </button>
                        </>
                      ) : (
                        <button
                          title={t("chat.cancel_request")}
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
              <p>{t("chat.no_pending_requests")}</p>
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
          {t("chat.blocked_users")} {expandedSections.blockedUsers ? "▼" : "▶"}
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
                        <p className="player-status">{t("chat.blocked")}</p>
                      </div>
                    </div>
                    <div className="player-actions">
                      <button
                        title={t("chat.unblock_user")}
                        onClick={() => unblockUser(user.blocked_record_id)}
                      >
                        🔓
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t("chat.no_blocked_users")}</p>
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
          {t("chat.non_friends")} {expandedSections.nonFriends ? "▼" : "▶"}
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
                          {user.online_status ? t("chat.online") : t("chat.offline")}
                        </p>
                      </div>
                    </div>
                    <div className="player-actions">
                      <button
                        title={t("chat.view_profile")}
                        onClick={() =>
                          window.open(`/user-profile/${user.id}`, "_blank")
                        }
                      >
                        👤
                      </button>
                      <button
                        title={t("chat.add_friend")}
                        onClick={() => addFriend(user.id)}
                      >
                        ➕
                      </button>
                      <button
                        title={t("chat.block")}
                        onClick={() => blockUser(user.id)}
                      >
                        🚫
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t("chat.no_non_friends")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerLists;

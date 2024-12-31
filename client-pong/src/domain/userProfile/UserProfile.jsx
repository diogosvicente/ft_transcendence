import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../template/Navbar";
import "../../assets/styles/userProfile.css";
import API_BASE_URL, { API_BASE_URL_NO_LANGUAGE } from "../../assets/config/config.js";

const UserProfile = () => {
  const { user_id } = useParams();
  const [user, setUser] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [error, setError] = useState(null);
  const defaultAvatar = `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`;
  const [friendshipId, setFriendshipId] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockerId, setBlockerId] = useState(null);
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [blockedRecordId, setBlockedRecordId] = useState(null);
  const [receiverFriendId, setReceiverFriendId] = useState(null);
  const [inviterFriendId, setInviterFriendId] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const accessToken = localStorage.getItem("access");
        const loggedId = localStorage.getItem("id");
        setLoggedUserId(loggedId);

        if (!accessToken) {
          setError("Access token não encontrado.");
          return;
        }

        if (parseInt(loggedId, 10) === parseInt(user_id, 10)) {
          setIsOwnProfile(true);
        }

        const userResponse = await axios.get(`${API_BASE_URL}/api/user-management/user-profile/${user_id}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setUser(userResponse.data);

        const matchResponse = await axios.get(`${API_BASE_URL}/api/user-management/match-history/${user_id}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setMatchHistory(matchResponse.data);

        const relationshipResponse = await axios.get(`${API_BASE_URL}/api/user-management/relationship/${user_id}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setFriendshipId(relationshipResponse.data.friendship_id);
        setFriendshipStatus(relationshipResponse.data.status);
        setIsBlocked(relationshipResponse.data.is_blocked);
        setBlockerId(relationshipResponse.data.blocker_id);
        setBlockedRecordId(relationshipResponse.data.blocked_record_id);
        setInviterFriendId(relationshipResponse.data.user_id);
        setReceiverFriendId(relationshipResponse.data.friend_id);
      } catch (err) {
        setError("Erro ao carregar o perfil do usuário ou informações de relacionamento.");
        console.error(err);
      }
    };

    fetchUserProfile();
  }, [user_id]);

  const handleAddFriend = async () => {
    try {
      const accessToken = localStorage.getItem("access");
      await axios.post(`${API_BASE_URL}/api/chat/add-friend/`, { friend_id: user_id }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      alert("Solicitação de amizade enviada com sucesso.");
      setFriendshipStatus("pending");
    } catch (err) {
      alert("Erro ao adicionar amigo.");
      console.error(err);
    }
  };

  const handleCancelRequest = async () => {
    try {
      const accessToken = localStorage.getItem("access");
      await axios.delete(`${API_BASE_URL}/api/chat/remove-friend/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { id: friendshipId },
      });
      alert("Solicitação de amizade cancelada.");
      setFriendshipId(null);
      setFriendshipStatus(null);
    } catch (err) {
      alert("Erro ao cancelar solicitação de amizade.");
      console.error(err);
    }
  };

  const handleAcceptFriendRequest = async () => {
    try {
      const accessToken = localStorage.getItem("access");
      await axios.post(`${API_BASE_URL}/api/chat/accept-friend/`, { request_id: friendshipId }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      alert("Solicitação de amizade aceita com sucesso.");
      setFriendshipStatus("accepted");
    } catch (err) {
      alert("Erro ao aceitar solicitação de amizade.");
      console.error(err);
    }
  };

  const handleRejectFriendRequest = async () => {
    try {
      const accessToken = localStorage.getItem("access");
      await axios.post(`${API_BASE_URL}/api/chat/reject-friend/`, { request_id: friendshipId }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      alert("Solicitação de amizade rejeitada.");
      setFriendshipId(null);
      setFriendshipStatus(null);
    } catch (err) {
      alert("Erro ao rejeitar solicitação de amizade.");
      console.error(err);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      const accessToken = localStorage.getItem("access");
      await axios.delete(`${API_BASE_URL}/api/chat/remove-friend/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { id: friendshipId },
      });
      alert("Amigo removido com sucesso.");
      setFriendshipId(null);
      setFriendshipStatus(null);
    } catch (err) {
      alert("Erro ao remover amigo.");
      console.error(err);
    }
  };

  const handleBlockUser = async () => {
    try {
      const accessToken = localStorage.getItem("access");
      await axios.post(`${API_BASE_URL}/api/chat/block-user/`, { user_id }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      alert("Usuário bloqueado com sucesso.");
      setIsBlocked(true);
    } catch (err) {
      alert("Erro ao bloquear usuário.");
      console.error(err);
    }
  };

  const handleUnblockUser = async () => {
    try {
      const accessToken = localStorage.getItem("access");
      await axios.post(`${API_BASE_URL}/api/chat/unblock-user/`, { blockedRecordId }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      alert("Usuário desbloqueado com sucesso.");
      setIsBlocked(false);
    } catch (err) {
      alert("Erro ao desbloquear usuário.");
      console.error(err);
    }
  };

  if (error) {
    return (
      <div>
        <Navbar />
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Navbar />
        <p>Carregando perfil...</p>
      </div>
    );
  }

  const totalMatches = (user.wins || 0) + (user.losses || 0);
  const winRate = totalMatches > 0 ? ((user.wins / totalMatches) * 100).toFixed(2) : 0;

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <img
            src={user.avatar ? `${API_BASE_URL_NO_LANGUAGE}${user.avatar}` : defaultAvatar}
            alt={user.display_name}
            className="profile-avatar"
          />
          <h1>{user.display_name}</h1>
          <p>
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: user.online_status ? "green" : "red",
                marginRight: "8px",
              }}
            ></span>
            {user.online_status ? "Online" : "Offline"}
          </p>
        </div>
        <div className="profile-info">
          <h2>Estatísticas</h2>
          <p>Partidas Jogadas: {totalMatches}</p>
          <p>Vitórias: {user.wins || 0}</p>
          <p>Derrotas: {user.losses || 0}</p>
          <p>Taxa de Vitória: {winRate}%</p>
          <p>Ranking: {user.rank}</p>
        </div>
        <div className="profile-actions">
          {isOwnProfile ? (
            <button
              title="Editar Minhas Informações"
              onClick={() => window.location.href = "/edit-profile"}
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
                      <button title="Cancelar Solicitação" onClick={handleCancelRequest} style={{ marginRight: "10px" }}>
                        ❌ Cancelar Solicitação ⏳
                      </button>
                      <button title="Bloquear Usuário" onClick={handleBlockUser} style={{ marginRight: "10px" }}>
                        🚫 Bloquear
                      </button>
                      <button title="Desafiar para Jogo" onClick={handleBlockUser}>
                        🎮 Desafiar
                      </button>
                    </div>
                  ) : loggedUserId === String(receiverFriendId) ? (
                    <div>
                      <button title="Aceitar Solicitação" onClick={handleAcceptFriendRequest} style={{ marginRight: "10px" }}>
                        ✔ Aceitar
                      </button>
                      <button title="Rejeitar Solicitação" onClick={handleRejectFriendRequest} style={{ marginRight: "10px" }}>
                        ❌ Rejeitar
                      </button>
                      <button title="Bloquear Usuário" onClick={handleBlockUser} style={{ marginRight: "10px" }}>
                        🚫 Bloquear
                      </button>
                      <button title="Desafiar para Jogo" onClick={handleBlockUser}>
                        🎮 Desafiar
                      </button>
                    </div>
                  ) : null
                ) : (
                  <div>
                    <button title="Remover Amigo" onClick={handleRemoveFriend} style={{ marginRight: "10px" }}>
                      ❌ Remover Amigo
                    </button>
                    <button title="Bloquear Usuário" onClick={handleBlockUser} style={{ marginRight: "10px" }}>
                      🚫 Bloquear
                    </button>
                    <button title="Desafiar para Jogo" onClick={handleBlockUser}>
                      🎮 Desafiar
                    </button>
                  </div>
                )
              ) : (
                <>
                  <button title="Adicionar Amigo" onClick={handleAddFriend} style={{ marginRight: "10px" }}>
                    ➕ Adicionar Amigo
                  </button>
                  <button title="Bloquear Usuário" onClick={handleBlockUser} style={{ marginRight: "10px" }}>
                    🚫 Bloquear
                  </button>
                  <button title="Desafiar para Jogo" onClick={handleBlockUser}>
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
        <div className="match-history">
          <h2>Histórico de Partidas</h2>
          {matchHistory.length > 0 ? (
            <table className="match-history-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Adversário</th>
                  <th>Resultado</th>
                  <th>Placar</th>
                </tr>
              </thead>
              <tbody>
                {matchHistory.map((match) => (
                  <tr key={match.id}>
                    <td>{new Date(match.date).toLocaleDateString()}</td>
                    <td>{match.opponent_display_name}</td>
                    <td>{match.result}</td>
                    <td>{match.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Nenhum histórico de partidas encontrado.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default UserProfile;

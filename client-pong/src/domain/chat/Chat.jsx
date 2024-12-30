import React, { useEffect, useState } from "react";
import Navbar from "../template/Navbar";
import axios from "axios";
import "../../assets/styles/chat.css";
import API_BASE_URL, { API_BASE_URL_NO_LANGUAGE } from "../../assets/config/config.js";

const Chat = () => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [nonFriends, setNonFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [error, setError] = useState(null);

  const defaultAvatar = `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`;

  const getAvatar = (avatarPath) => {
    if (!avatarPath) return defaultAvatar;
    if (!avatarPath.startsWith("/media/")) {
      return `${API_BASE_URL_NO_LANGUAGE}/media/${avatarPath}`;
    }
    return `${API_BASE_URL_NO_LANGUAGE}${avatarPath}`;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const accessToken = localStorage.getItem("access");
      // console.log(accessToken);
      if (!accessToken) {
        setError("Access token não encontrado.");
        return;
      }

      try {
        const friendsResponse = await axios.get(`${API_BASE_URL}/api/chat/friends/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setFriends(
          (friendsResponse.data.friends || []).map((friend) => ({
            ...friend,
            avatar: getAvatar(friend.avatar),
          }))
        );

        const pendingResponse = await axios.get(`${API_BASE_URL}/api/chat/pending-requests/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setPendingRequests(
          (pendingResponse.data.pending_requests || []).map((request) => ({
            ...request,
            avatar: getAvatar(request.avatar),
          }))
        );

        const blockedResponse = await axios.get(`${API_BASE_URL}/api/chat/blocked-users/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setBlockedUsers(
          (blockedResponse.data.blocked_users || []).map((user) => ({
            ...user,
            avatar: getAvatar(user.avatar),
            blocked_record_id: user.blocked_record_id, // Inclui o blocked_record_id no estado
          }))
        );
        

        console.log(blockedResponse.data)

        // Busca não amigos
        const nonFriendsResponse = await axios.get(
          `${API_BASE_URL}/api/user-management/exclude-self/`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const updatedNonFriends = nonFriendsResponse.data.users.map((user) => {
          const avatar = getAvatar(user.avatar);
          return {
            ...user,
            avatar,
          };
        });
        setNonFriends(updatedNonFriends);
      } catch (err) {
        setError("Erro ao buscar a lista de amigos ou não amigos.");
        console.error(err);
      }
    };

    fetchUsers();
  }, []);

  const sendMessage = () => {
    if (currentMessage.trim()) {
      setMessages([...messages, { text: currentMessage, sender: "Você" }]);
      setCurrentMessage("");
    }
  };

  const addFriend = async (userId) => {
    const accessToken = localStorage.getItem("access");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/add-friend/`,
        { friend_id: userId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      alert(response.data.message);
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao adicionar amigo.");
      console.error(err);
    }
  };

  const blockUser = async (userId) => {
    const accessToken = localStorage.getItem("access");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/block-user/`,
        { user_id: userId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      alert("Usuário bloqueado com sucesso.");
    } catch (err) {
      console.error("Erro ao bloquear usuário:", err);
      alert(err.response?.data?.error || "Erro ao bloquear usuário.");
    }
  };

  const unblockUser = async (blockedRecordId) => {
    const accessToken = localStorage.getItem("access");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/unblock-user/`,
        { blockedRecordId }, // Envia o ID do registro de bloqueio
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      alert("Usuário desbloqueado com sucesso.");
      setBlockedUsers((prev) => prev.filter((user) => user.blocked_record_id !== blockedRecordId));
    } catch (err) {
      console.error("Erro ao desbloquear usuário:", err);
      alert(err.response?.data?.error || "Erro ao desbloquear usuário.");
    }
  };

  const acceptFriendRequest = async (requestId) => {
    const accessToken = localStorage.getItem("access");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/accept-friend/`,
        { request_id: requestId }, // Envia o ID da tabela `chat_friend`
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      alert("Solicitação de amizade aceita com sucesso.");
      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
      setFriends((prev) => [...prev, ...pendingRequests.filter((req) => req.id === requestId)]);
    } catch (err) {
      console.error("Erro ao aceitar solicitação:", err);
      alert(err.response?.data?.error || "Erro ao aceitar solicitação.");
    }
  };

  const rejectFriendRequest = async (requestId) => {
    const accessToken = localStorage.getItem("access");
    try {
      await axios.post(
        `${API_BASE_URL}/api/chat/reject-friend/`,
        { request_id: requestId }, // Envia o ID da tabela `chat_friend`
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      alert("Solicitação de amizade rejeitada com sucesso.");
      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error("Erro ao rejeitar solicitação:", err);
      alert(err.response?.data?.error || "Erro ao rejeitar solicitação.");
    }
  };

  const removeFriend = async (friendId) => {
    const accessToken = localStorage.getItem("access");
    try {
      await axios.delete(`${API_BASE_URL}/api/chat/remove-friend/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { id: friendId },
      });
      alert("Amigo removido com sucesso.");
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    } catch (err) {
      console.error("Erro ao remover amigo:", err);
      alert(err.response?.data?.error || "Erro ao remover amigo.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="chat-container">
        <div className="players-list">
          <h3>Lista de Jogadores</h3>
          {error && <p className="text-danger">{error}</p>}

          {/* Amigos */}
          <div className="friends-section">
            <h4>Amigos</h4>
            {friends.length > 0 ? (
              <ul>
                {friends.map((friend) => (
                  <li key={friend.id} className="player-item">
                    <img src={friend.avatar} alt={friend.display_name} className="player-avatar" />
                    <div className="player-info">
                      <p className="player-name">{friend.display_name}</p>
                      <p className="player-status">{friend.is_online ? "Online" : "Offline"}</p>
                    </div>
                    <div className="player-actions">
                      <button
                        title="Ver Perfil"
                        onClick={() => window.open(`/user-profile/${friend.user_id}`, "_blank")}
                      >
                        👤
                      </button>
                      <button title="Desafiar">🎮</button>
                      <button title="Bloquear" onClick={() => blockUser(friend.user_id)}>🚫</button>
                      <button title="Excluir" onClick={() => removeFriend(friend.id)}>❌</button>
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
                      <div className="player-actions">
                        <button
                          title="Desbloquear"
                          onClick={() => unblockUser(user.blocked_record_id)} // Passa o blocked_record_id
                        >
                          🔓
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum usuário bloqueado.</p>
            )}
          </div>

          {/* Não Amigos */}
          {/* Seção de Não Amigos */}
          <div className="non-friends-section">
                <h4>Não Amigos</h4>
                {nonFriends.length > 0 ? (
                  <ul>
                    {nonFriends.map((user) => (
                      <li key={user.id} className="player-item">
                        <img
                          src={user.avatar} // Exibe o avatar do não amigo
                          alt={user.display_name}
                          className="player-avatar"
                        />
                        <div>
                          <p className="player-name">{user.display_name}</p>
                          <p className="player-status">
                            {user.is_online ? "Online" : "Offline"}
                          </p>
                        </div>
                        <div className="player-actions">
                          <button
                            title="Ver Perfil"
                            onClick={() => window.open(`/user-profile/${user.id}`, "_blank")}
                          >
                            👤
                          </button>
                          <button
                            title="Adicionar como amigo"
                            onClick={() => addFriend(user.id)} // Chama a função para adicionar amigo
                          >
                            ➕
                          </button>
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

        {/* Chat Global */}
        <div className="chat-section">
          <h3>Chat Global</h3>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className="chat-message">
                <strong>{message.sender}:</strong> {message.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <textarea
              placeholder="Digite sua mensagem"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
            ></textarea>
            <button onClick={sendMessage}>Enviar</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;

import React, { useEffect, useState } from "react";
import Navbar from "../template/Navbar";
import axios from "axios";
import "../../assets/styles/chat.css";
import API_BASE_URL, { API_BASE_URL_NO_LANGUAGE } from "../../assets/config/config.js";
import { useWebSocket } from "../webSocket/WebSocketProvider.jsx";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const Chat = () => {

  const { wsSendMessage } = useWebSocket();

  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [nonFriends, setNonFriends] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [error, setError] = useState(null);
  const [activeChat, setActiveChat] = useState("global");
  const [chatTabs, setChatTabs] = useState([]); // Para gerenciar abas de chat

  const defaultAvatar = `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`;

  const getAvatar = (avatarPath) => {
    if (!avatarPath) return defaultAvatar;
    if (!avatarPath.startsWith("/media/")) {
      return `${API_BASE_URL_NO_LANGUAGE}/media/${avatarPath}`;
    }
    return `${API_BASE_URL_NO_LANGUAGE}${avatarPath}`;
  };

  const openChatWithUser = (friend) => {
    if (!chatTabs.some((tab) => tab.id === friend.id)) {
      setChatTabs((prev) => [...prev, { id: friend.id, name: friend.display_name }]);
    }
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

        const closeChatTab = (tabId) => {
          setChatTabs((prev) => prev.filter((tab) => tab.id !== tabId));
        };

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

  const sendChatMessage = (chatId) => {
    if (currentMessage.trim()) {
      setChatMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), { text: currentMessage, sender: "Você" }],
      }));
      setCurrentMessage("");
    }
  };

  const openChat = (friendId, displayName) => {
    setActiveChat(friendId);
    if (!chatMessages[friendId]) {
      setChatMessages((prev) => ({ ...prev, [friendId]: [] }));
    }
  };

  const addFriend = async (userId) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/add-friend/`,
        { friend_id: userId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Enviar notificação via WebSocket
      wsSendMessage({
        type: "notification",
        action: "addFriend",
        sender_id: loggedID, // ID do remetente
        receiver_id: userId, // ID do destinatário
        message: `Você recebeu uma solicitação de amizade.`,
      });

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
                  <div className="player-header">
                    <img src={friend.avatar} alt={friend.display_name} className="player-avatar" />
                    <div className="player-details">
                      <p className="player-name">{friend.display_name}</p>
                      <p className="player-status">
                        {friend.online_status ? (
                          <span className="status-indicator online">Online</span>
                        ) : (
                          <span className="status-indicator offline">Offline</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="player-actions">
                    <button title="Abrir Chat" onClick={() => openChatWithUser(friend)} style={{ margin: "5px" }}>
                      💬
                    </button>
                    <button
                      title="Ver Perfil"
                      onClick={() => window.open(`/user-profile/${friend.user_id}`, "_blank")}
                      style={{ margin: "5px" }}
                    >
                      👤
                    </button>
                    <button title="Desafiar" style={{ margin: "5px" }}>🎮</button>
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

          {/* Não Amigos */}
          <div className="non-friends-section">
            <h4>Não Amigos</h4>
            {nonFriends.length > 0 ? (
              <ul>
                {nonFriends.map((user) => (
                  <li key={user.id} className="player-item">
                    <img
                      src={user.avatar}
                      alt={user.display_name}
                      className="player-avatar"
                    />
                    <div className="player-info">
                      <p className="player-name">{user.display_name}</p>
                      <p className="player-status">
                        <span
                          className={user.is_online ? "status-dot online" : "status-dot offline"}
                        ></span>
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
                        onClick={() => addFriend(user.id)}
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

        {/* Área de Chat */}
        <div className="chat-section">
          <div className="chat-tabs">
            <button
              className={`chat-tab ${!chatTabs.length ? "active" : ""}`}
              onClick={() => setChatTabs([])}
            >
              Chat Global
            </button>
            {chatTabs.map((tab) => (
              <button
                key={tab.id}
                className="chat-tab"
                onClick={() => setActiveChat(tab.id)}
              >
                {tab.name} <span onClick={() => closeChatTab(tab.id)}>❌</span>
              </button>
            ))}
          </div>

          <div className="chat-messages">
            {!chatTabs.length ? (
              chatMessages.map((message, index) => (
                <div key={index} className="chat-message">
                  <strong>{message.sender}:</strong> {message.text}
                </div>
              ))
            ) : (
              <div className="chat-private">
                {/* Renderize aqui as mensagens privadas da aba ativa */}
                <p>Chat privado com {chatTabs.find((tab) => tab.id === activeChat)?.name}</p>
              </div>
            )}
          </div>

          <div className="chat-input">
            <textarea
              placeholder="Digite sua mensagem"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
            ></textarea>
            <button onClick={sendChatMessage}>Enviar</button>
          </div>
        </div>

      </div>
    </>
  );
};

export default Chat;

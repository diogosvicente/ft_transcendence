import React, { useEffect, useState } from "react";
import Navbar from "../template/Navbar";
import axios from "axios";
import "../../assets/styles/chat.css";
import API_BASE_URL, { API_BASE_URL_NO_LANGUAGE } from "../../assets/config/config.js";

const Chat = () => {
  const [friends, setFriends] = useState([]); // Estado para amigos
  const [nonFriends, setNonFriends] = useState([]); // Estado para não amigos
  const [messages, setMessages] = useState([]); // Estado para as mensagens do chat
  const [currentMessage, setCurrentMessage] = useState(""); // Estado para a mensagem atual
  const [error, setError] = useState(null); // Estado para erros

  const defaultAvatar = `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`; // Avatar padrão

  // Função utilitária para obter o avatar
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
      if (!accessToken) {
        setError("Access token não encontrado.");
        return;
      }

      try {
        // Busca amigos
        const friendsResponse = await axios.get(`${API_BASE_URL}/api/chat/friends/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const updatedFriends = friendsResponse.data.friends.map((friend) => {
          const avatar = getAvatar(friend.avatar);
          return {
            ...friend,
            avatar,
          };
        });
        setFriends(updatedFriends);

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
      setCurrentMessage(""); // Limpa o campo de mensagem
    }
  };

  return (
    <>
      <Navbar />
      <div className="chat-container">
        {/* Lista de Amigos e Não Amigos */}
        <div className="players-list">
          <h3>Lista de Jogadores</h3>
          {error && <p className="text-danger">{error}</p>}
          {friends.length > 0 || nonFriends.length > 0 ? (
            <div>
              {/* Seção de Amigos */}
              <div className="friends-section">
                <h4>Amigos</h4>
                {friends.length > 0 ? (
                  <ul>
                    {friends.map((friend) => (
                      <li key={friend.id} className="player-item">
                        <img
                          src={friend.avatar} // Exibe o avatar do amigo
                          alt={friend.display_name}
                          className="player-avatar"
                        />
                        <div>
                          <p className="player-name">{friend.display_name}</p>
                          <p className="player-status">
                            {friend.is_online ? "Online" : "Offline"}
                          </p>
                        </div>
                        <div className="player-actions">
                          <button title="Ver Perfil">👤</button>
                          <button title="Desafiar">🎮</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Você ainda não tem amigos adicionados.</p>
                )}
              </div>

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
                          <button title="Ver Perfil">👤</button>
                          <button title="Adicionar como amigo">➕</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Não há usuários disponíveis para adicionar.</p>
                )}
              </div>
            </div>
          ) : (
            <p>Não há dados para exibir.</p>
          )}
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
              placeholder="Digite aqui sua mensagem"
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

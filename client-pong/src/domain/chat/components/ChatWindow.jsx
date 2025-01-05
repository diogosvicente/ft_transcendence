import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import "../../../assets/styles/chatWindow.css";
import API_BASE_URL, { API_BASE_URL_NO_LANGUAGE } from "../../../assets/config/config.js"; // Base URL da API

const ChatWindow = () => {
  const [messages, setMessages] = useState([]); // Lista de mensagens
  const [message, setMessage] = useState(""); // Mensagem atual digitada
  const [userProfiles, setUserProfiles] = useState({}); // Cache para perfis de usuários
  const chatSocketRef = useRef(null); // Referência do WebSocket
  const GLOBAL_ROOM = "global"; // Nome da sala global
  const WS_CHAT_URL = "ws://localhost:8000/ws/chat/"; // URL base do WebSocket do chat

  const userId = localStorage.getItem("id"); // ID do usuário atual
  const userAvatar = localStorage.getItem("avatar"); // Avatar do usuário atual
  const userDisplayName = localStorage.getItem("display_name"); // Display name do usuário atual
  const accessToken = localStorage.getItem("access"); // Token de acesso

  // Função para buscar o perfil do usuário pelo ID
  const fetchUserProfile = async (id) => {
    if (userProfiles[id]) return userProfiles[id]; // Retorna do cache, se disponível

    try {
      const response = await axios.get(`${API_BASE_URL}/api/user-management/user-profile/${id}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = response.data;

      // Completa a URL do avatar com a base, se necessário
      profile.avatar = profile.avatar
        ? `${API_BASE_URL_NO_LANGUAGE}${profile.avatar}`
        : `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`;

      setUserProfiles((prev) => ({ ...prev, [id]: profile })); // Atualiza o cache
      return profile;
    } catch (err) {
      console.error(`Erro ao buscar perfil do usuário com ID ${id}:`, err);
      return null;
    }
  };

  // Conectar ao WebSocket
  const connectWebSocket = useCallback(() => {
    if (!accessToken) {
      console.warn("Access token não encontrado. Não é possível conectar ao WebSocket.");
      return;
    }

    const ws = new WebSocket(`${WS_CHAT_URL}?access_token=${accessToken}`);

    ws.onopen = () => {
      console.log("Conectado ao chat global.");
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat_message") {
        // Busca o perfil do remetente se não estiver no cache
        const profile = await fetchUserProfile(data.sender);

        // Adiciona ao estado apenas se a mensagem não for duplicada
        setMessages((prev) => {
          const isDuplicate = prev.some(
            (msg) => msg.text === data.text && msg.timestamp === data.timestamp
          );
          return isDuplicate
            ? prev
            : [
                ...prev,
                {
                  ...data,
                  display_name: profile?.display_name || "Usuário Desconhecido",
                  avatar: profile?.avatar, // Avatar retornado pela API
                },
              ];
        });
      }
    };

    ws.onclose = () => {
      console.warn("Desconectado do WebSocket. Tentando reconectar...");
      setTimeout(() => connectWebSocket(), 3000); // Reconexão automática
    };

    ws.onerror = (error) => {
      console.error("Erro no WebSocket do chat:", error);
    };

    chatSocketRef.current = ws;
  }, [accessToken]);

  useEffect(() => {
    connectWebSocket(); // Conecta ao WebSocket ao montar o componente

    return () => {
      if (chatSocketRef.current) {
        chatSocketRef.current.close(); // Fecha conexão ao desmontar
      }
    };
  }, [connectWebSocket]);

  // Enviar mensagem
  const sendMessage = () => {
    if (chatSocketRef.current && message.trim()) {
      const payload = {
        type: "chat_message",
        room: GLOBAL_ROOM,
        sender: userId,
        display_name: userDisplayName,
        avatar: userAvatar,
        text: message.trim(),
        timestamp: new Date().toISOString(),
      };

      chatSocketRef.current.send(JSON.stringify(payload)); // Envia mensagem via WebSocket
      setMessage(""); // Limpa o campo de entrada
    }
  };

  return (
    <div className="chat-section">
      {/* Abas do Chat */}
      <div className="chat-tabs">
        <button className="chat-tab">Chat Global</button>
      </div>

      {/* Mensagens do Chat */}
      <div className="chat-messages">
        {messages.length > 0 ? (
          messages.map((msg, index) => {
            const isOwnMessage = msg.sender === userId;

            return (
              <div
                key={index}
                className={`chat-message ${isOwnMessage ? "chat-message-own" : ""}`}
                style={{
                  alignSelf: isOwnMessage ? "flex-end" : "flex-start",
                  textAlign: isOwnMessage ? "right" : "left",
                }}
              >
                <div className="chat-header">
                  {!isOwnMessage && (
                    <img
                      src={msg.avatar} // Avatar do usuário
                      alt="Avatar"
                      className="chat-avatar"
                    />
                  )}
                  <strong>{isOwnMessage ? "Eu" : msg.display_name}</strong>
                </div>
                <p className="chat-text">{msg.text}</p>
                <div className="chat-timestamp">
                  {new Date(msg.timestamp).toLocaleString()}
                </div>
              </div>
            );
          })
        ) : (
          <p>Sem mensagens neste chat.</p>
        )}
      </div>

      {/* Campo de Entrada de Mensagem */}
      <div className="chat-input">
        <textarea
          placeholder="Digite sua mensagem"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
        ></textarea>
        <button onClick={sendMessage}>Enviar</button>
      </div>
    </div>
  );
};

export default ChatWindow;

import React, { useState, useEffect, useRef } from "react";
import "../../../assets/styles/chatWindow.css";
import useWebSocketManager from "../hooks/WebSocketManager";
import { API_BASE_URL_NO_LANGUAGE } from "../../../assets/config/config.js";

const ChatWindow = ({ chatTabs, activeTab, setActiveTab, closeChatTab, resetChatWindow  }) => {
  const [message, setMessage] = useState("");
  const privateWebSockets = useRef({});
  const { messages: globalMessages, sendMessage: sendGlobalMessage } = useWebSocketManager("global");
  const [privateMessages, setPrivateMessages] = useState({});

  // Inicializa um WebSocket privado
  const initializePrivateWebSocket = (roomId) => {
    if (privateWebSockets.current[roomId]) {
      const readyState = privateWebSockets.current[roomId].readyState;
      if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) return;
    }

    const ws = new WebSocket(
      `ws://localhost:8000/ws/chat/${roomId}/?access_token=${localStorage.getItem("access")}`
    );

    ws.onopen = () => {
      console.log(`Conectado ao WebSocket privado: ${roomId}`);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrivateMessages((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), data],
      }));
    };

    ws.onclose = () => {
      console.warn(`WebSocket privado desconectado: ${roomId}`);
    };

    ws.onerror = (error) => {
      console.error(`Erro no WebSocket privado (${roomId}):`, error);
    };

    privateWebSockets.current[roomId] = ws;
  };

  // Envia mensagens privadas
  const sendPrivateMessage = (roomId, message) => {
    const ws = privateWebSockets.current[roomId];
    if (ws && ws.readyState === WebSocket.OPEN && message.trim()) {
      ws.send(
        JSON.stringify({
          type: "chat_message",
          room: roomId,
          sender: localStorage.getItem("id"),
          message: message.trim(),
          timestamp: new Date().toISOString(),
        })
      );
    } else if (ws && ws.readyState !== WebSocket.OPEN) {
      console.warn(`WebSocket para o roomId ${roomId} não está aberto. Reabrindo...`);
      initializePrivateWebSocket(roomId); // Tenta reconectar se necessário
    } else {
      console.error("WebSocket não está inicializado ou mensagem inválida.");
    }
  };

  // Inicializa WebSockets para todas as abas privadas
  useEffect(() => {
    chatTabs.forEach((tab) => {
      if (tab.id !== "global") {
        initializePrivateWebSocket(tab.roomId);
      }
    });

    return () => {
      Object.values(privateWebSockets.current).forEach((ws) => ws.close());
    };
  }, [chatTabs]);

  const handleSendMessage = () => {
    if (activeTab === "global") {
      sendGlobalMessage(message);
    } else {
      const activeRoom = chatTabs.find((tab) => tab.id === activeTab)?.roomId;
      if (activeRoom) {
        sendPrivateMessage(activeRoom, message);
      }
    }
    setMessage("");
  };

  const currentMessages =
    activeTab === "global"
      ? globalMessages
      : privateMessages[chatTabs.find((tab) => tab.id === activeTab)?.roomId] || [];

  return (
    <div className="chat-section">
      <div className="chat-tabs">
        {chatTabs.map((tab) => (
          <div key={tab.id} className="chat-tab-container">
            <button
              className={`chat-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
            </button>
            {tab.id !== "global" && (
              <button className="close-tab" onClick={() => closeChatTab(tab.id)}>
                ❌
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="chat-messages">
        {currentMessages.length > 0 ? (
          currentMessages.map((msg, index) => {
            const isOwnMessage = msg.sender === localStorage.getItem("id");
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
                      src={
                        msg.avatar
                          ? `${API_BASE_URL_NO_LANGUAGE}${msg.avatar}`
                          : `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`
                      }
                      alt="Avatar"
                      className="chat-avatar"
                    />
                  )}
                  <strong>{isOwnMessage ? "Eu" : msg.display_name || "Usuário Desconhecido"}</strong>
                </div>
                <p className="chat-text">{msg.message || "Mensagem não disponível"}</p>
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

      <div className="chat-input">
        <textarea
          placeholder="Digite sua mensagem"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())
          }
        ></textarea>
        <button onClick={handleSendMessage}>Enviar</button>
      </div>
    </div>
  );
};

export default ChatWindow;

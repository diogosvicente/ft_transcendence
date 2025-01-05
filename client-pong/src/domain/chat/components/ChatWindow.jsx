import React, { useState, useEffect, useRef } from "react";
import "../../../assets/styles/chatWindow.css";
import useWebSocketManager from "../assets/WebSocketManager";
import { API_BASE_URL_NO_LANGUAGE } from "../../../assets/config/config.js";

const ChatWindow = ({ chatTabs, activeTab, setActiveTab, closeChatTab }) => {
  const [message, setMessage] = useState("");
  const privateWebSockets = useRef({});

  const { messages: globalMessages, sendMessage: sendGlobalMessage } = useWebSocketManager("global");

  const [privateMessages, setPrivateMessages] = useState({});

  const initializePrivateWebSocket = (tabId) => {
    if (privateWebSockets.current[tabId]) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${tabId}/?access_token=${localStorage.getItem("access")}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrivateMessages((prev) => ({
        ...prev,
        [tabId]: [...(prev[tabId] || []), data],
      }));
    };

    ws.onclose = () => {
      console.warn(`Desconectado do room privado: ${tabId}`);
    };

    ws.onerror = (error) => {
      console.error(`Erro no WebSocket do room privado: ${tabId}`, error);
    };

    privateWebSockets.current[tabId] = ws;
  };

  const sendPrivateMessage = (tabId, message) => {
    const ws = privateWebSockets.current[tabId];
    if (ws && message.trim()) {
      ws.send(
        JSON.stringify({
          type: "chat_message",
          room: tabId,
          sender: localStorage.getItem("id"),
          message: message.trim(),
          timestamp: new Date().toISOString(),
        })
      );
    }
  };

  useEffect(() => {
    chatTabs.forEach((tab) => {
      if (tab.id !== "global") {
        initializePrivateWebSocket(tab.id);
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
      sendPrivateMessage(activeTab, message);
    }
    setMessage("");
  };

  const currentMessages =
    activeTab === "global"
      ? globalMessages
      : privateMessages[activeTab] || [];

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

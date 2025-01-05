import React, { useState } from "react";
import "../../../assets/styles/chatWindow.css";
import useWebSocketManager from "../assets/WebSocketManager";
import useWebSocketManagerPrivateChat from "../assets/WebSocketManagerPrivateChat";
import { API_BASE_URL_NO_LANGUAGE } from "../../../assets/config/config.js"; // Importe aqui

const ChatWindow = ({ chatTabs, activeTab, setActiveTab, closeChatTab }) => {
  const [message, setMessage] = useState(""); // Mensagem digitada

  // Escolhe o WebSocket correto com base na aba ativa
  const { messages: globalMessages, sendMessage: sendGlobalMessage } = useWebSocketManager();
  const { messages: privateMessages, sendMessage: sendPrivateMessage } =
    activeTab !== "global"
      ? useWebSocketManagerPrivateChat(activeTab)
      : { messages: [], sendMessage: () => {} };

  // Filtra mensagens da aba ativa
  const currentMessages = activeTab === "global" ? globalMessages : privateMessages;

  const handleSendMessage = () => {
    if (activeTab === "global") {
      sendGlobalMessage(message);
    } else {
      sendPrivateMessage(message);
    }
    setMessage(""); // Limpa o campo de entrada após envio
  };

  return (
    <div className="chat-section">
      {/* Abas do Chat */}
      <div className="chat-tabs">
        {chatTabs.map((tab) => (
          <div key={tab.id} className="chat-tab-container">
            <button
              className={`chat-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)} // Troca a aba ativa
            >
              {tab.name}
            </button>
            {tab.id !== "global" && (
              <button
                className="close-tab"
                onClick={() => closeChatTab(tab.id)} // Fecha a aba
              >
                ❌
              </button>
            )}
          </div>
        ))}
      </div>
  
      {/* Mensagens do Chat */}
      <div className="chat-messages">
        {currentMessages && currentMessages.length > 0 ? (
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
  
      {/* Campo de Entrada de Mensagem */}
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

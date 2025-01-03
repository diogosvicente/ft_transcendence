import React from "react";

const ChatWindow = ({
  chatTabs,
  chatMessages,
  activeChat,
  setActiveChat,
  sendChatMessage,
  currentMessage,
  setCurrentMessage,
  closeChatTab,
}) => {
  return (
    <div className="chat-section">
      {/* Abas do Chat */}
      <div className="chat-tabs">
        <button
          className={`chat-tab ${activeChat === "global" ? "active" : ""}`}
          onClick={() => setActiveChat("global")}
        >
          Chat Global
        </button>
        {chatTabs.map((tab) => (
          <div key={tab.id} className="chat-tab-container">
            <button
              className={`chat-tab ${activeChat === tab.id ? "active" : ""}`}
              onClick={() => setActiveChat(tab.id)}
            >
              {tab.name}
            </button>
            <button className="close-tab" onClick={() => closeChatTab(tab.id)}>
              ❌
            </button>
          </div>
        ))}
      </div>

      {/* Mensagens do Chat */}
      <div className="chat-messages">
        {Array.isArray(chatMessages[activeChat]) ? (
          chatMessages[activeChat].map((message, index) => (
            <div key={index} className="chat-message">
              <strong>{message.sender}:</strong> {message.text}
            </div>
          ))
        ) : (
          <p>Sem mensagens neste chat.</p>
        )}
      </div>
      {/* Campo de Entrada de Mensagem */}
      <div className="chat-input">
        <textarea
          placeholder="Digite sua mensagem"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
        ></textarea>
        <button
          onClick={() => {
            const activeTab = chatTabs.find((tab) => tab.id === activeChat);
            sendChatMessage(activeChat, activeTab?.id || "global"); // Envia a mensagem com base no chat ativo
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;

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
          className={`chat-tab ${!chatTabs.length ? "active" : ""}`}
          onClick={() => setActiveChat("global")}
        >
          Chat Global
        </button>
        {chatTabs.map((tab) => (
          <button
            key={tab.id}
            className={`chat-tab ${activeChat === tab.id ? "active" : ""}`}
            onClick={() => setActiveChat(tab.id)}
          >
            {tab.name}
            <span onClick={() => closeChatTab(tab.id)}>❌</span>
          </button>
        ))}
      </div>

      {/* Mensagens do Chat */}
      <div className="chat-messages">
        {!chatTabs.length ? (
          chatMessages.map((message, index) => (
            <div key={index} className="chat-message">
              <strong>{message.sender}:</strong> {message.text}
            </div>
          ))
        ) : (
          <div className="chat-private">
            <p>
              Chat privado com{" "}
              {chatTabs.find((tab) => tab.id === activeChat)?.name || "Usuário"}
            </p>
            {chatMessages[activeChat]?.map((message, index) => (
              <div key={index} className="chat-message">
                <strong>{message.sender}:</strong> {message.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campo de Entrada de Mensagem */}
      <div className="chat-input">
        <textarea
          placeholder="Digite sua mensagem"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
        ></textarea>
        <button onClick={() => sendChatMessage(activeChat)}>Enviar</button>
      </div>
    </div>
  );
};

export default ChatWindow;

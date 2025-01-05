import { useState, useEffect, useRef } from "react";

const useWebSocketManagerPrivateChat = (roomId) => {
  const [messages, setMessages] = useState([]);
  const chatSocketRef = useRef(null);

  const userId = localStorage.getItem("id");
  const accessToken = localStorage.getItem("access");
  const WS_CHAT_URL = "ws://localhost:8000/ws/chat/";

  useEffect(() => {
    if (!roomId || !accessToken) return;

    const ws = new WebSocket(`${WS_CHAT_URL}${roomId}/?access_token=${accessToken}`);
    chatSocketRef.current = ws;

    ws.onopen = () => {
      console.log(`Conectado ao room privado: ${roomId}`);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat_message") {
        setMessages((prev) => [...prev, data]);
      }
    };

    ws.onclose = () => {
      console.warn(`Desconectado do room privado: ${roomId}`);
    };

    ws.onerror = (error) => {
      console.error("Erro no WebSocket do chat privado:", error);
    };

    return () => {
      if (chatSocketRef.current) {
        chatSocketRef.current.close();
        chatSocketRef.current = null;
      }
    };
  }, [roomId, accessToken]);

  const sendMessage = (message) => {
    if (chatSocketRef.current && message.trim()) {
      const payload = {
        type: "chat_message",
        room: roomId,
        sender: userId,
        text: message.trim(),
        timestamp: new Date().toISOString(),
      };
      chatSocketRef.current.send(JSON.stringify(payload));
    }
  };

  return { messages, sendMessage };
};

export default useWebSocketManagerPrivateChat;

import { useState, useEffect, useRef } from "react";
import { getWsUrl } from "../../../assets/config/config";

const useWebSocketManagerPrivateChat = (roomId) => {
  const [messages, setMessages] = useState([]);
  const chatSocketRef = useRef(null);
  const WS_CHAT_URL = getWsUrl("/ws/chat/");

  const userId = localStorage.getItem("id");
  const accessToken = localStorage.getItem("access");

  useEffect(() => {
    if (!roomId || !accessToken) return;

    const ws = new WebSocket(`${WS_CHAT_URL}${roomId}/?access_token=${accessToken}`);
    chatSocketRef.current = ws;

    ws.onopen = () => {
      console.log(`Conectado ao room privado: ${roomId}`);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
    
      // Verifica se os dados recebidos estão completos
      if (data.message && data.sender) {
        setMessages((prev) => [...prev, data]);
      } else {
        console.warn("Dados da mensagem privada estão incompletos:", data);
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
      }
    };
  }, [roomId, accessToken]);

  const sendMessage = (message) => {
    if (chatSocketRef.current && message.trim()) {
      const payload = {
        type: "chat_message",
        room: roomId,
        sender: userId,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };
      chatSocketRef.current.send(JSON.stringify(payload));
    }
  };

  return { messages, sendMessage };
};

export default useWebSocketManagerPrivateChat;

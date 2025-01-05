import { useState, useRef, useCallback, useEffect } from "react";

const useWebSocketManager = (roomName = "global") => {
  const [messages, setMessages] = useState([]); // Mensagens recebidas
  const chatSocketRef = useRef(null);
  const WS_CHAT_URL = "ws://localhost:8000/ws/chat/";

  const userId = localStorage.getItem("id");
  const accessToken = localStorage.getItem("access");

  const connectWebSocket = useCallback(() => {
    if (!accessToken) {
      console.warn("Access token não encontrado. Não é possível conectar ao WebSocket.");
      return;
    }

    const ws = new WebSocket(`${WS_CHAT_URL}${roomName}/?access_token=${accessToken}`);
    chatSocketRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Verifica se os dados recebidos estão completos
      if (data.message && data.sender) {
        setMessages((prev) => [...prev, data]);
      } else {
        console.warn("Dados da mensagem incompletos:", data);
      }
    };

    ws.onclose = () => {
      console.warn(`Desconectado do room: ${roomName}. Tentando reconectar...`);
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
      console.error(`Erro no WebSocket do room: ${roomName}`, error);
    };
  }, [roomName, accessToken]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (chatSocketRef.current) {
        chatSocketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const sendMessage = (message) => {
    if (chatSocketRef.current && message.trim()) {
      const payload = {
        type: "chat_message",
        room: roomName,
        sender: userId,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };
      chatSocketRef.current.send(JSON.stringify(payload));
    }
  };

  return { messages, sendMessage };
};

export default useWebSocketManager;

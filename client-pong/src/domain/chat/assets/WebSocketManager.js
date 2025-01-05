import { useState, useRef, useCallback, useEffect } from "react";

const useWebSocketManager = (roomName = "global") => {
  const [messages, setMessages] = useState([]); // Mensagens recebidas
  const chatSocketRef = useRef(null); // Referência do WebSocket
  const WS_CHAT_URL = "ws://localhost:8000/ws/chat/"; // Base URL do WebSocket

  const userId = localStorage.getItem("id"); // ID do usuário atual
  const accessToken = localStorage.getItem("access"); // Token de acesso

  const connectWebSocket = useCallback(() => {
    if (!accessToken) {
      console.warn("Access token não encontrado. Não é possível conectar ao WebSocket.");
      return;
    }

    const ws = new WebSocket(`${WS_CHAT_URL}${roomName}/?access_token=${accessToken}`);
    chatSocketRef.current = ws;

    ws.onopen = () => {
      console.log(`Conectado ao room: ${roomName}`);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Adiciona a mensagem ao estado
      setMessages((prev) => [...prev, data]);
    };

    ws.onclose = () => {
      console.warn(`Desconectado do room: ${roomName}. Tentando reconectar...`);
      setTimeout(connectWebSocket, 3000); // Reconexão automática
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
        text: message.trim(),
        timestamp: new Date().toISOString(),
      };
      chatSocketRef.current.send(JSON.stringify(payload));
    } else {
      console.warn("WebSocket não está conectado. Não é possível enviar a mensagem.");
    }
  };

  return { messages, sendMessage };
};

export default useWebSocketManager;

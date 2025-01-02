import React, { createContext, useContext, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WebSocketContext = createContext();

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  const WS_BASE_URL = "ws://localhost:8000/ws/chat/";

  // Função para inicializar o WebSocket dinamicamente
  const initializeWebSocket = (accessToken, currentUserId, isManual = false) => {
    if (!accessToken) {
      console.warn("Usuário deslogado. WebSocket não será inicializado.");
      return;
    }

    if (socketRef.current) {
      socketRef.current.close();
    }

    const ws = new WebSocket(`${WS_BASE_URL}?access_token=${accessToken}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(isManual ? "WebSocket manual conectado" : "WebSocket conectado");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Mensagem recebida via WebSocket:", data);

      if (data.type === "notification") {
        setNotifications((prev) => [...prev, data]);

        if (String(data.receiver_id) === String(currentUserId)) {
          toast.info(`Nova notificação: ${data.message}`);
        }
      } else if (data.type === "chat") {
        setMessages((prev) => [...prev, data]);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket desconectado.");
      setTimeout(() => {
        if (socketRef.current) socketRef.current.close();
        setSocket(null);
      }, 5000); // Reconexão automática
    };

    ws.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };

    setSocket(ws);
  };

  // Inicialização automática no primeiro render
  React.useEffect(() => {
    const accessToken = localStorage.getItem("access");
    const currentUserId = localStorage.getItem("id");
    initializeWebSocket(accessToken, currentUserId);
  }, []); // Sem dependências para rodar apenas no primeiro render

  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket não está conectado.");
    }
  };

  const value = {
    initializeWebSocket, // Disponibiliza a função para uso externo
    sendMessage,
    messages,
    notifications,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

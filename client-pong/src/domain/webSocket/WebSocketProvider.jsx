import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
  const accessToken = localStorage.getItem("access"); // Obtém o token de acesso do localStorage
  const currentUserId = localStorage.getItem("id"); // Obtém o ID do usuário logado

  useEffect(() => {
    const initializeWebSocket = () => {
      if (!accessToken) {
        console.error("Access token não encontrado. Não é possível conectar ao WebSocket.");
        return;
      }

      // Adiciona o token JWT na query string
      const ws = new WebSocket(`${WS_BASE_URL}?access_token=${accessToken}`);

      ws.onopen = () => {
        console.log("WebSocket conectado");
        socketRef.current = ws;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Mensagem recebida via WebSocket:", data);

        // Processa mensagens do tipo 'notification' ou 'chat'
        if (data.type === "notification") {
          setNotifications((prev) => [...prev, data]);

          // Exibe um toast se o receiver_id for igual ao ID do usuário atual
          if (data.receiver_id === currentUserId) {
            toast.info(`Nova notificação: ${data.message}`, {
              position: toast.POSITION.TOP_RIGHT,
            });
          }
        } else if (data.type === "chat") {
          setMessages((prev) => [...prev, data]);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket desconectado, tentando reconectar...");
        setTimeout(() => initializeWebSocket(), 5000); // Reconexão automática
      };

      ws.onerror = (error) => {
        console.error("Erro no WebSocket:", error);
      };

      setSocket(ws);
    };

    initializeWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [currentUserId, accessToken]);

  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket não está conectado.");
    }
  };

  const value = {
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

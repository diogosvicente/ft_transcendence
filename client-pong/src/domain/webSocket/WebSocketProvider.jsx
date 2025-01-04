import React, { createContext, useContext, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WebSocketContext = createContext();

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ children }) => {
  const [notificationSocket, setNotificationSocket] = useState(null);
  const [chatSocket, setChatSocket] = useState(null);

  const [notifications, setNotifications] = useState([]); // Lista de notificações
  const [chatMessages, setChatMessages] = useState([]); // Lista de mensagens de chat

  const notificationSocketRef = useRef(null);
  const chatSocketRef = useRef(null);

  const WS_NOTIFICATION_URL = "ws://localhost:8000/ws/notifications/";
  const WS_CHAT_URL = "ws://localhost:8000/ws/chat/";

  // Função genérica para inicializar WebSocket
  const initializeWebSocket = (url, socketRef, setSocket, onMessageCallback, type, context) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log(
        `%cConectado ao ${type} websocket via ${context}`,
        "color: green; font-weight: bold;"
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
    
      if (data.type === "chat") {
        const { sender_id, receiver_id, text, timestamp } = data;
    
        const userId = localStorage.getItem("id"); // ID do usuário logado
        const chatId = receiver_id === "global" ? "global" : sender_id === userId ? receiver_id : sender_id;
    
        // Atualiza o estado para re-renderizar os componentes do chat
        setChatMessages((prev) => ({
          ...prev,
          [chatId]: [
            ...(prev[chatId] || []), // Mensagens anteriores no chat
            { sender: sender_id === userId ? "Você" : `Usuário ${sender_id}`, text, timestamp },
          ],
        }));
      };onMessageCallback(data);
    };
    

    ws.onclose = () => {
      console.warn(
        `%c${type.charAt(0).toUpperCase() + type.slice(1)} websocket desconectado.`,
        "color: orange; font-weight: bold;",
        `Tentando reconexão...`
      );
      setTimeout(() => initializeWebSocket(url, socketRef, setSocket, onMessageCallback, type, context), 500);
    };

    ws.onerror = (error) => {
      console.error(
        `%cErro no ${type} websocket:`,
        "color: red; font-weight: bold;",
        error
      );
    };

    socketRef.current = ws;
    setSocket(ws);
  };

  // Funções para inicializar WebSockets de notificações e chat
  const initializeNotificationWebSocket = (accessToken, currentUserId, context = "re-render") => {
    if (!accessToken) {
      console.warn(
        `%cWebSocket de notificações não será inicializado: Usuário deslogado.`,
        "color: orange; font-weight: bold;"
      );
      return;
    }

    const url = `${WS_NOTIFICATION_URL}?access_token=${accessToken}`;
    initializeWebSocket(url, notificationSocketRef, setNotificationSocket, (data) => {
      if (data.type === "notification") {
        setNotifications((prev) => [...prev, data]);
        toast.info(`Notificação: ${data.message}`);
      }
    }, "notification", context);
  };

  const initializeChatWebSocket = (accessToken, currentUserId, context = "re-render") => {
    if (!accessToken) {
      console.warn(
        `%cWebSocket de chat não será inicializado: Usuário deslogado.`,
        "color: orange; font-weight: bold;"
      );
      return;
    }

    const url = `${WS_CHAT_URL}?access_token=${accessToken}`;
    initializeWebSocket(url, chatSocketRef, setChatSocket, (data) => {
      if (data.type === "chat") {
        setChatMessages((prev) => [...prev, data]);
      }
    }, "chat", context);
  };

  // Funções para enviar mensagens
  const wsSendNotificationMessage = (message) => {
    if (notificationSocketRef.current && notificationSocketRef.current.readyState === WebSocket.OPEN) {
      notificationSocketRef.current.send(JSON.stringify(message));
      console.log(
        `%cMensagem enviada via WebSocket de notificações:`,
        "color: purple; font-weight: bold;",
        message
      );
    } else {
      console.error("WebSocket de notificações não está conectado.");
    }
  };

  const wsSendChatMessage = (message) => {
    if (chatSocketRef.current && chatSocketRef.current.readyState === WebSocket.OPEN) {
      chatSocketRef.current.send(JSON.stringify(message));
      console.log(
        `%cMensagem enviada via WebSocket de chat:`,
        "color: purple; font-weight: bold;",
        message
      );
    } else {
      console.error("WebSocket de chat não está conectado.");
    }
  };

  // Inicialização automática ao carregar
  React.useEffect(() => {
    const accessToken = localStorage.getItem("access");
    const currentUserId = localStorage.getItem("id");
    initializeNotificationWebSocket(accessToken, currentUserId, "re-render");
    initializeChatWebSocket(accessToken, currentUserId, "re-render");
  }, []); // Sem dependências para rodar apenas no primeiro render

  const value = {
    notifications,
    chatMessages,
    wsSendNotificationMessage,
    wsSendChatMessage,
    initializeNotificationWebSocket,
    initializeChatWebSocket,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

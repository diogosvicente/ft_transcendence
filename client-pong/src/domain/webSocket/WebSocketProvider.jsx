import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WebSocketContext = createContext();

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const notificationSocketRef = useRef(null);

  const WS_NOTIFICATION_URL = "ws://localhost:8000/ws/notifications/";

  // Função para inicializar o WebSocket de notificações
  const initializeNotificationWebSocket = (accessToken, userId, context = "manual") => {
    if (!accessToken || !userId) {
      console.warn(
        `%cWebSocket de notificações não será inicializado: Token ou ID do usuário ausentes.`,
        "color: orange; font-weight: bold;"
      );
      return;
    }

    if (notificationSocketRef.current) {
      console.log("WebSocket de notificações já está conectado.");
      return;
    }

    const wsUrl = `${WS_NOTIFICATION_URL}?access_token=${accessToken}&user_id=${userId}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(
        `%cConectado ao WebSocket de notificações (${context})`,
        "color: green; font-weight: bold;"
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // console.log(`%cMensagem recebida (notificação):`, "color: blue;", data);

      if (data.type === "notification") {
        setNotifications((prev) => [...prev, data]);
        toast.info(`Notificação: ${data.message}`);
      }
    };

    ws.onclose = () => {
      console.warn(
        `%cWebSocket de notificações desconectado. Tentando reconexão...`,
        "color: orange; font-weight: bold;"
      );
      setTimeout(() => initializeNotificationWebSocket(accessToken, userId, "reconnect"), 3000);
    };

    ws.onerror = (error) => {
      console.error(`%cErro no WebSocket de notificações:`, "color: red;", error);
    };

    notificationSocketRef.current = ws;
  };

  // Função para enviar mensagens via WebSocket de notificações
  const wsSendNotification = (message) => {
    if (notificationSocketRef.current && notificationSocketRef.current.readyState === WebSocket.OPEN) {
      notificationSocketRef.current.send(JSON.stringify(message));
      // console.log(
      //   `%cMensagem enviada via WebSocket de notificações:`,
      //   "color: purple; font-weight: bold;",
      //   message
      // );
    } else {
      console.error("WebSocket de notificações não está conectado.");
    }
  };

  // Fechar WebSocket ao desmontar
  const closeNotificationWebSocket = () => {
    if (notificationSocketRef.current) {
      notificationSocketRef.current.close();
      notificationSocketRef.current = null;
      console.log(`%cWebSocket de notificações fechado.`, "color: red; font-weight: bold;");
    }
  };

  // Inicialização automática ao carregar ou recarregar
  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    const userId = localStorage.getItem("id");

    if (accessToken && userId) {
      initializeNotificationWebSocket(accessToken, userId, "auto");
    }

    return () => {
      closeNotificationWebSocket();
    };
  }, []); // Somente no primeiro render

  const value = {
    notifications,
    wsSendNotification,
    initializeNotificationWebSocket,
    closeNotificationWebSocket,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export default WebSocketProvider;

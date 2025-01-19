import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WebSocketContext = createContext();

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [shouldResetChatWindow, setShouldResetChatWindow] = useState(false); // Flag para resetar ChatWindow
  const notificationSocketRef = useRef(null);

  const WS_NOTIFICATION_URL = "ws://localhost:8000/ws/notifications/";

  const initializeNotificationWebSocket = (accessToken, userId, context = "manual") => {
    if (!accessToken || !userId) {
      console.warn(
        "%cWebSocket de notificações não será inicializado: Token ou ID do usuário ausentes.",
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
      processWebSocketMessage(event);
    };

    ws.onclose = () => {
      console.warn(
        "%cWebSocket de notificações desconectado. Tentando reconexão...",
        "color: orange; font-weight: bold;"
      );
      setTimeout(() => initializeNotificationWebSocket(accessToken, userId, "reconnect"), 3000);
    };

    ws.onerror = (error) => {
      console.error("%cErro no WebSocket de notificações:", "color: red;", error);
    };

    notificationSocketRef.current = ws;
  };

  const processWebSocketMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Mensagem recebida do WebSocket:", data);

      if (data.type === "notification") {
        setNotifications((prev) => [...prev, data]);
        toast.info(`Notificação: ${data.message}`);

        // Ativa a flag para resetar o ChatWindow ao detectar mensagens de bloqueio
        if (
          data.message === "Você foi bloqueado." ||
          data.message === "Você bloqueou o usuário." ||
          data.message === "Você foi removido da lista de amigos." ||
          data.message === "Você removeu um amigo da sua lista."
        ) {
          console.log("Bloqueio detectado. Ativando flag para resetar ChatWindow...");
          setShouldResetChatWindow(true);
        }
      } else if (data.type === "tournament") {
        handleNewTournament(data);
      } else if (data.type === "tournament_update") {
        handleTournamentUpdate(data);
      } else {
        console.warn("Tipo de mensagem desconhecido:", data.type);
      }
    } catch (error) {
      console.error("Erro ao processar mensagem WebSocket:", error);
    }
  };

  const handleNewTournament = (data) => {
    console.log("Torneio recebido via WebSocket:", data.tournament);
    setNotifications((prev) => [...prev, data]);
    toast.success(`Novo torneio criado: ${data.tournament.name}`);
  };

  const handleTournamentUpdate = (data) => {
    const tournament = data.tournament || {};
    const name = tournament.name || "Desconhecido";
    const totalParticipants = tournament.total_participants || 0;
    const status = tournament.status || "unknown";

    if (!tournament.id) {
      console.warn("Mensagem WebSocket ignorada por falta de ID:", data);
      return;
    }

    console.log("Atualização de torneio recebida:", tournament);

    setNotifications((prev) => [...prev, data]);

    if (status === "ongoing") {
      toast.success(tournament.message || `O torneio '${name}' foi iniciado!`);
    } else {
      toast.info(
        `Torneio atualizado: ${name} agora tem ${totalParticipants} participantes.`
      );
    }

    setTournaments((prevTournaments) =>
      prevTournaments.map((t) =>
        t.id === tournament.id
          ? {
              ...t,
              total_participants: totalParticipants,
              status: status,
            }
          : t
      )
    );
  };

  const wsSendNotification = (message) => {
    if (notificationSocketRef.current && notificationSocketRef.current.readyState === WebSocket.OPEN) {
      notificationSocketRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket de notificações não está conectado.");
    }
  };

  const closeNotificationWebSocket = () => {
    if (notificationSocketRef.current) {
      notificationSocketRef.current.close();
      notificationSocketRef.current = null;
      console.log("%cWebSocket de notificações fechado.", "color: red; font-weight: bold;");
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    const userId = localStorage.getItem("id");

    if (accessToken && userId) {
      initializeNotificationWebSocket(accessToken, userId, "auto");
    }

    return () => {
      closeNotificationWebSocket();
    };
  }, []);

  const value = {
    notifications,
    tournaments,
    wsSendNotification,
    initializeNotificationWebSocket,
    closeNotificationWebSocket,
    shouldResetChatWindow, // Expõe a flag para o Chat
    setShouldResetChatWindow, // Permite resetar a flag
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export default WebSocketProvider;

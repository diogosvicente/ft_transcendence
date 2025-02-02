import axios from "axios";
import { useState, useRef, useCallback, useEffect } from "react";
import API_BASE_URL, { getWsUrl } from "../../../assets/config/config.js";

const useWebSocketManager = (roomName = "global") => {
  const [messages, setMessages] = useState([]); // Mensagens recebidas
  const [blockedUsers, setBlockedUsers] = useState([]); // IDs de usuários bloqueados
  const blockedUsersRef = useRef([]); // Referência para manter os usuários bloqueados atualizados
  const chatSocketRef = useRef(null);
  const WS_CHAT_URL = getWsUrl("/ws/chat/");

  const userId = localStorage.getItem("id");
  const accessToken = localStorage.getItem("access");

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/blocked-users-ids-list/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setBlockedUsers(response.data.blocked_users); // Salva os IDs de usuários bloqueados
      blockedUsersRef.current = response.data.blocked_users; // Atualiza o valor na referência
    } catch (error) {
      console.error("Erro ao buscar usuários bloqueados:", error);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const connectWebSocket = useCallback(() => {
    if (!accessToken) {
      console.warn("Access token não encontrado. Não é possível conectar ao WebSocket.");
      return;
    }

    const ws = new WebSocket(`${WS_CHAT_URL}${roomName}/?access_token=${accessToken}`);
    chatSocketRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log("blockedUsersRef: ", blockedUsersRef.current);

      // Verifica se os dados recebidos estão completos
      if (data.message && data.sender) {
        // Permite a mensagem se for do próprio usuário ou se o sender não estiver bloqueado
        if (data.sender === userId || !blockedUsersRef.current.includes(parseInt(data.sender))) {
          setMessages((prev) => [...prev, data]);
        } else {
          console.warn(`Mensagem ignorada do sender bloqueado (${data.sender})`);
        }
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

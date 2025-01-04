import axios from "axios";
import API_BASE_URL from "../../../assets/config/config.js";
import { useWebSocket } from "../../webSocket/WebSocketProvider.jsx";

export const addFriend = async (userId, wsSendNotificationMessage) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");

    try {
        await axios.post(
            `${API_BASE_URL}/api/chat/add-friend/`,
            { friend_id: userId },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        wsSendNotificationMessage({
            type: "notification",
            action: "addFriend",
            sender_id: loggedID,
            receiver_id: userId,
            message: `Você recebeu uma solicitação de amizade.`,
            payload: { sender_id: loggedID, receiver_id: userId },
        });
    } catch (err) {
        console.error("Erro ao adicionar amigo:", err);
        throw new Error(err.response?.data?.error || "Erro ao adicionar amigo.");
    }
};

export const blockUser = async (userId, wsSendNotificationMessage, setBlockedUsers) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");
  
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/block-user/`,
        { user_id: userId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
  
      // Atualizar lista de usuários bloqueados
      setBlockedUsers((prev) => [...prev, response.data]);
  
      // Enviar notificação para o usuário bloqueado
      wsSendNotificationMessage({
        type: "notification",
        action: "blockUser",
        sender_id: loggedID,
        receiver_id: userId,
        message: `Você foi bloqueado.`,
        payload: { sender_id: loggedID, receiver_id: userId },
      });
  
      // Enviar notificação para quem realizou o bloqueio
      wsSendNotificationMessage({
        type: "notification",
        action: "blockUser",
        sender_id: userId,
        receiver_id: loggedID,
        message: `Você bloqueou o usuário.`,
        payload: { sender_id: userId, receiver_id: loggedID },
      });
  
    } catch (err) {
      console.error("Erro ao bloquear usuário:", err);
      throw new Error(err.response?.data?.error || "Erro ao bloquear usuário.");
    }
  };
  

export const unblockUser = async (blockedRecordId, wsSendNotificationMessage) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");

    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/chat/unblock-user/`,
            { blockedRecordId },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const { blocked_id } = response.data;

        wsSendNotificationMessage({
            type: "notification",
            action: "unblockUser",
            sender_id: loggedID,
            receiver_id: blocked_id,
            message: `Você foi desbloqueado.`,
            payload: { sender_id: loggedID, receiver_id: blocked_id },
        });
    } catch (err) {
        console.error("Erro ao desbloquear usuário:", err);
        throw new Error(err.response?.data?.error || "Erro ao desbloquear usuário.");
    }
};

export const acceptFriendRequest = async (requestId, wsSendNotificationMessage) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");

    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/chat/accept-friend/`,
            { request_id: requestId },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const { user_id } = response.data;

        wsSendNotificationMessage({
            type: "notification",
            action: "acceptFriend",
            sender_id: loggedID,
            receiver_id: user_id,
            message: `Sua solicitação de amizade foi aceita.`,
            payload: { sender_id: loggedID, receiver_id: user_id },
        });
    } catch (err) {
        console.error("Erro ao aceitar solicitação de amizade:", err);
        throw new Error(err.response?.data?.error || "Erro ao aceitar solicitação.");
    }
};

export const rejectFriendRequest = async (requestId, wsSendNotificationMessage) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");

    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/chat/reject-friend/`,
            { request_id: requestId },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const { user_id } = response.data;

        wsSendNotificationMessage({
            type: "notification",
            action: "rejectFriend",
            sender_id: loggedID,
            receiver_id: user_id,
            message: `Sua solicitação de amizade foi rejeitada.`,
            payload: { sender_id: loggedID, receiver_id: user_id },
        });
    } catch (err) {
        console.error("Erro ao rejeitar solicitação de amizade:", err);
        throw new Error(err.response?.data?.error || "Erro ao rejeitar solicitação.");
    }
};

export const removeFriend = async (requestId, wsSendNotificationMessage) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");

    try {
        const response = await axios.delete(`${API_BASE_URL}/api/chat/remove-friend/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            data: { id: requestId },
        });

        const { user_id } = response.data;

        wsSendNotificationMessage({
            type: "notification",
            action: "removeFriend",
            sender_id: loggedID,
            receiver_id: user_id,
            message: `Você foi removido da lista de amigos.`,
            payload: { sender_id: loggedID, receiver_id: user_id },
        });
    } catch (err) {
        console.error("Erro ao remover amigo:", err);
        throw new Error(err.response?.data?.error || "Erro ao remover amigo.");
    }
};

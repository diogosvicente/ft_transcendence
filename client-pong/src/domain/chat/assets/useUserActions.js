import axios from "axios";
import API_BASE_URL from "../../../assets/config/config.js";

const useUserActions = (wsSendNotification) => {
  const addFriend = async (userId) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");

    try {
      await axios.post(
        `${API_BASE_URL}/api/chat/add-friend/`,
        { friend_id: userId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      wsSendNotification({
        type: "notification",
        action: "addFriend",
        sender_id: loggedID,
        receiver_id: userId,
        message: `Você recebeu uma solicitação de amizade.`,
        payload: { sender_id: loggedID, receiver_id: userId },
      });

      wsSendNotification({
        type: "notification",
        action: "addFriend",
        sender_id: userId,
        receiver_id: loggedID,
        message: `Você enviou uma solicitação de amizade.`,
        payload: { sender_id: userId, receiver_id: loggedID },
      });
    } catch (err) {
      console.error("Erro ao adicionar amigo:", err);
      alert(err.response?.data?.error || "Erro ao adicionar amigo.");
    }
  };

  const blockUser = async (userId) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");

    try {
      await axios.post(
        `${API_BASE_URL}/api/chat/block-user/`,
        { user_id: userId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      wsSendNotification({
        type: "notification",
        action: "blockUser",
        sender_id: loggedID,
        receiver_id: userId,
        message: `Você foi bloqueado.`,
        payload: { sender_id: loggedID, receiver_id: userId },
      });

      wsSendNotification({
        type: "notification",
        action: "blockUser",
        sender_id: userId,
        receiver_id: loggedID,
        message: `Você bloqueou o usuário.`,
        payload: { sender_id: userId, receiver_id: loggedID },
      });
    } catch (err) {
      console.error("Erro ao bloquear usuário:", err);
      alert(err.response?.data?.error || "Erro ao bloquear usuário.");
    }
  };

  const unblockUser = async (blockedRecordId) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/unblock-user/`,
        { blockedRecordId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const { blocked_id } = response.data;

      wsSendNotification({
        type: "notification",
        action: "unblockUser",
        sender_id: loggedID,
        receiver_id: blocked_id,
        message: `Você foi desbloqueado.`,
        payload: { sender_id: loggedID, receiver_id: blocked_id },
      });

      wsSendNotification({
        type: "notification",
        action: "unblockUser",
        sender_id: blocked_id,
        receiver_id: loggedID,
        message: `Você desbloqueou o usuário.`,
        payload: { sender_id: blocked_id, receiver_id: loggedID },
      });
    } catch (err) {
      console.error("Erro ao desbloquear usuário:", err);
      alert(err.response?.data?.error || "Erro ao desbloquear usuário.");
    }
  };

  const acceptFriendRequest = async (requestId) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/accept-friend/`,
        { request_id: requestId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const { user_id } = response.data;

      wsSendNotification({
        type: "notification",
        action: "acceptFriend",
        sender_id: loggedID,
        receiver_id: user_id,
        message: `Sua solicitação de amizade foi aceita.`,
        payload: { sender_id: loggedID, receiver_id: user_id },
      });

      wsSendNotification({
        type: "notification",
        action: "acceptFriend",
        sender_id: user_id,
        receiver_id: loggedID,
        message: `Você aceitou a solicitação de amizade.`,
        payload: { sender_id: user_id, receiver_id: loggedID },
      });
    } catch (err) {
      console.error("Erro ao aceitar solicitação:", err);
      alert(err.response?.data?.error || "Erro ao aceitar solicitação.");
    }
  };

  const rejectFriendRequest = async (requestId) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/reject-friend/`,
        { request_id: requestId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const { user_id } = response.data;

      wsSendNotification({
        type: "notification",
        action: "rejectFriend",
        sender_id: loggedID,
        receiver_id: user_id,
        message: `Sua solicitação de amizade foi rejeitada.`,
        payload: { sender_id: loggedID, receiver_id: user_id },
      });

      wsSendNotification({
        type: "notification",
        action: "rejectFriend",
        sender_id: user_id,
        receiver_id: loggedID,
        message: `Você rejeitou a solicitação de amizade.`,
        payload: { sender_id: user_id, receiver_id: loggedID },
      });
    } catch (err) {
      console.error("Erro ao rejeitar solicitação:", err);
      alert(err.response?.data?.error || "Erro ao rejeitar solicitação.");
    }
  };

  const removeFriend = async (requestId) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");

    try {
      await axios.delete(`${API_BASE_URL}/api/chat/remove-friend/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { id: requestId },
      });

      wsSendNotification({
        type: "notification",
        action: "removeFriend",
        sender_id: loggedID,
        message: `Você removeu um amigo da sua lista.`,
      });
    } catch (err) {
      console.error("Erro ao remover amigo:", err);
      alert(err.response?.data?.error || "Erro ao remover amigo.");
    }
  };

  return {
    addFriend,
    blockUser,
    unblockUser,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  };
};

export default useUserActions;

import axios from "axios";
import API_BASE_URL from "../../../assets/config/config.js";

const useUserActions = (wsSendNotification) => {

  const getAuthDetails = () => ({
    accessToken: localStorage.getItem("access"),
    loggedID: localStorage.getItem("id"),
  });

  const sendNotification = (type, action, sender_id, receiver_id, message, payload) => {
    wsSendNotification({
      type,
      action,
      sender_id,
      receiver_id,
      message,
      payload,
    });
  };

  const handleError = (err, defaultMessage) => {
    console.error(defaultMessage, err);
    alert(err.response?.data?.error || defaultMessage);
  };

  const addFriend = async (userId) => {
    const { accessToken, loggedID } = getAuthDetails();
  
    try {
      await axios.post(
        `${API_BASE_URL}/api/chat/add-friend/`,
        { friend_id: userId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Enviar notificação para o destinatário (userId) e remetente (loggedID)
      sendNotification(
        "notification",
        "addFriend",
        loggedID,
        userId,
        "Você recebeu uma solicitação de amizade.",
        { sender_id: loggedID, receiver_id: userId }
      );
  
      sendNotification(
        "notification",
        "addFriend",
        userId,
        loggedID,
        "Você enviou uma solicitação de amizade.",
        { sender_id: userId, receiver_id: loggedID }
      );
  
    } catch (err) {
      handleError(err, "Erro ao adicionar amigo.");
    }
  };

  const blockUser = async (userId) => {
    const { accessToken, loggedID } = getAuthDetails();

    try {
      await axios.post(
        `${API_BASE_URL}/api/chat/block-user/`,
        { user_id: userId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      sendNotification(
        "notification",
        "blockUser",
        loggedID,
        userId,
        "Você foi bloqueado.",
        { sender_id: loggedID, receiver_id: userId }
      );

      sendNotification(
        "notification",
        "blockUser",
        userId,
        loggedID,
        "Você bloqueou o usuário.",
        { sender_id: userId, receiver_id: loggedID }
      );
    } catch (err) {
      handleError(err, "Erro ao bloquear usuário.");
    }
  };

  const unblockUser = async (blockedRecordId) => {
    const { accessToken, loggedID } = getAuthDetails();

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/unblock-user/`,
        { blockedRecordId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const { blocked_id } = response.data;

      sendNotification(
        "notification",
        "unblockUser",
        loggedID,
        blocked_id,
        "Você foi desbloqueado.",
        { sender_id: loggedID, receiver_id: blocked_id }
      );

      sendNotification(
        "notification",
        "unblockUser",
        blocked_id,
        loggedID,
        "Você desbloqueou o usuário.",
        { sender_id: blocked_id, receiver_id: loggedID }
      );
    } catch (err) {
      handleError(err, "Erro ao desbloquear usuário.");
    }
  };

  const acceptFriendRequest = async (requestId) => {
    const { accessToken, loggedID } = getAuthDetails();

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/accept-friend/`,
        { request_id: requestId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const { friend_id, user_id } = response.data;

      sendNotification(
        "notification",
        "acceptFriend",
        loggedID,
        user_id,
        "Sua solicitação de amizade foi aceita.",
        { sender_id: loggedID, receiver_id: user_id }
      );

      sendNotification(
        "notification",
        "acceptFriend",
        user_id,
        loggedID,
        "Você aceitou a solicitação de amizade.",
        { sender_id: user_id, receiver_id: loggedID }
      );
    } catch (err) {
      handleError(err, "Erro ao aceitar solicitação.");
    }
  };

  const rejectFriendRequest = async (requestId) => {
    const { accessToken, loggedID } = getAuthDetails();

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/reject-friend/`,
        { request_id: requestId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const { user_id, friend_id } = response.data;
      const receiver_id = user_id === loggedID ? friend_id : user_id;

      sendNotification(
        "notification",
        "rejectFriend",
        user_id,
        friend_id,
        "Sua solicitação de amizade foi rejeitada.",
        { sender_id: loggedID, receiver_id }
      );

      sendNotification(
        "notification",
        "rejectFriend",
        friend_id,
        user_id,
        "Você rejeitou a solicitação de amizade.",
        { sender_id: receiver_id, receiver_id: loggedID }
      );
    } catch (err) {
      handleError(err, "Erro ao rejeitar solicitação.");
    }
  };

  const removeFriend = async (requestId) => {
    const { accessToken, loggedID } = getAuthDetails();

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/chat/remove-friend/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { id: requestId },
      });

      const { user_id, friend_id } = response.data;
      const receiverId = user_id === loggedID ? friend_id : user_id;

      sendNotification(
        "notification",
        "removeFriend",
        loggedID,
        receiverId,
        "Você foi removido da lista de amigos.",
        { sender_id: loggedID, receiver_id: receiverId }
      );

      sendNotification(
        "notification",
        "removeFriend",
        receiverId,
        loggedID,
        "Você removeu um amigo da sua lista.",
        { sender_id: receiverId, receiver_id: loggedID }
      );
    } catch (err) {
      handleError(err, "Erro ao remover amigo.");
    }
  };

  const challengeUser = async (userId) => {
    const { accessToken, loggedID } = getAuthDetails();

    try {
      sendNotification(
        "notification",
        "challengeUser",
        loggedID,
        userId,
        "Você desafiou este usuário para uma partida!",
        { sender_id: loggedID, receiver_id: userId }
      );

      alert("Desafio enviado com sucesso!");
    } catch (err) {
      handleError(err, "Erro ao desafiar usuário.");
    }
  };

  return {
    addFriend,
    blockUser,
    unblockUser,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    challengeUser,
  };
};

export default useUserActions;

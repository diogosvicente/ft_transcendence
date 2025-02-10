import axios from "axios";
import API_BASE_URL from "../../../assets/config/config.js";

const useUserActions = (wsSendNotification, resetChatWindow)  => {

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
  
      if (resetChatWindow) {
        resetChatWindow();
      } else {
        console.warn("resetChatWindow não foi fornecido ao useUserActions.");
      }
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

        // Reseta o ChatWindow ao remover um amigo
        if (resetChatWindow) {
            console.log("Resetando ChatWindow após remoção de amigo...");
            resetChatWindow();
        } else {
            console.warn("resetChatWindow não foi fornecido ao useUserActions.");
        }
    } catch (err) {
        handleError(err, "Erro ao remover amigo.");
    }
  };

  const challengeUser = async (userId, tournamentId = null) => {
    const { accessToken, loggedID } = getAuthDetails();
  
    try {
      // Envia o tournament_id (se for de torneio, um valor; senão, null) junto com o opponent_id para o backend
      const response = await axios.post(
        `${API_BASE_URL}/api/game/challenge-user/`,
        { opponent_id: userId, tournament_id: tournamentId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
  
      const matchId = response.data.match_id;
  
      if (!matchId) {
        console.error("match_id não está definido na resposta do backend.");
        alert("Erro ao registrar o desafio. Tente novamente.");
        return;
      }
  
      // Notificação para o desafiante
      sendNotification(
        "notification",
        "challengeUser",
        userId,
        loggedID,
        "Você enviou um desafio para uma partida!",
        { sender_id: loggedID, receiver_id: userId, match_id: matchId, tournament_id: tournamentId }
      );
  
      // Notificação para o desafiado
      sendNotification(
        "notification",
        "challengeUser",
        loggedID, // ID do remetente (você)
        userId, // ID do destinatário (oponente)
        "Você foi desafiado para uma partida!",
        { sender_id: userId, receiver_id: loggedID, match_id: matchId, tournament_id: tournamentId }
      );
  
    } catch (err) {
      console.error("Erro ao desafiar usuário:", err);
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

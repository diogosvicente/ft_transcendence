import axios from "axios";
import API_BASE_URL from "../../../assets/config/config.js";
import { useTranslation } from "react-i18next";

const useUserActions = (wsSendNotification, resetChatWindow)  => {

  const { t } = useTranslation();

  const getAuthDetails = () => ({
    accessToken: localStorage.getItem("access"),
    loggedID: localStorage.getItem("id"),
  });

  const getUserLanguage = async (userId) => {
    const { accessToken } = getAuthDetails();
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user-management/user/${userId}/language/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      // Retorna o idioma salvo no campo current_language
      return response.data.current_language;
    } catch (err) {
      console.error("Erro ao obter o idioma do usuário:", err);
      throw err;
    }
  };

  const getTranslatedMessage = async (key, userId) => {
    // Obtém o idioma do usuário a partir do backend
    const userLanguage = await getUserLanguage(userId);
    // Retorna a tradução usando o idioma específico
    return t(key, { lng: userLanguage });
  };
  

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

      // Executa as chamadas de tradução de forma concorrente
      const [messageForReceiver, messageForSender] = await Promise.all([
        getTranslatedMessage("notification.friend_request_received", userId),
        getTranslatedMessage("notification.friend_request_sent", loggedID)
      ]);

      // Enviar notificação para o destinatário (userId) e remetente (loggedID)
      sendNotification(
        "notification",
        "addFriend",
        loggedID,
        userId,
        messageForReceiver,
        { sender_id: loggedID, receiver_id: userId }
      );
  
      sendNotification(
        "notification",
        "addFriend",
        userId,
        loggedID,
        messageForSender,
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

      const [messageForReceiver, messageForSender] = await Promise.all([
        getTranslatedMessage("notification.blocked_you", userId),
        getTranslatedMessage("notification.blocked_user", loggedID)
      ]);
  
      sendNotification(
        "notification",
        "blockUser",
        loggedID,
        userId,
        messageForReceiver,
        { sender_id: loggedID, receiver_id: userId }
      );
  
      sendNotification(
        "notification",
        "blockUser",
        userId,
        loggedID,
        messageForSender,
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

      const [messageForReceiver, messageForSender] = await Promise.all([
        getTranslatedMessage("notification.unblocked_you", blocked_id),
        getTranslatedMessage("notification.unblocked_user", loggedID)
      ]);

      sendNotification(
        "notification",
        "unblockUser",
        loggedID,
        blocked_id,
        messageForReceiver,
        { sender_id: loggedID, receiver_id: blocked_id }
      );

      sendNotification(
        "notification",
        "unblockUser",
        blocked_id,
        loggedID,
        messageForSender,
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

      const [messageForReceiver, messageForSender] = await Promise.all([
        getTranslatedMessage("notification.friend_request_accepted_receiver", user_id),
        getTranslatedMessage("notification.friend_request_accepted_sender", loggedID)
      ]);

      sendNotification(
        "notification",
        "acceptFriend",
        loggedID,
        user_id,
        messageForReceiver,
        { sender_id: loggedID, receiver_id: user_id }
      );

      sendNotification(
        "notification",
        "acceptFriend",
        user_id,
        loggedID,
        messageForSender,
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

      const [messageForReceiver, messageForSender] = await Promise.all([
        getTranslatedMessage("notification.friend_request_rejected_receiver", user_id),
        getTranslatedMessage("notification.friend_request_rejected_sender", friend_id)
      ]);

      sendNotification(
        "notification",
        "rejectFriend",
        friend_id,
        user_id,
        messageForReceiver,
        { sender_id: loggedID, receiver_id }
      );

      sendNotification(
        "notification",
        "rejectFriend",
        user_id,
        friend_id,
        messageForSender,
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

        console.log("user_id = " + user_id);
        console.log("friend_id = " + friend_id);
        console.log("loggedID = " + loggedID);

        const [messageForReceiver, messageForSender] = await Promise.all([
          getTranslatedMessage("notification.friend_removed", friend_id),
          getTranslatedMessage("notification.friend_removed_by_you", loggedID)
        ]);

        if (user_id == loggedID) {
            sendNotification(
              "notification",
              "removeFriend",
              loggedID,
              friend_id,
              messageForReceiver,
              { sender_id: loggedID, receiver_id: friend_id }
          );
        } else {

          const [messageForReceiver, messageForSender] = await Promise.all([
            getTranslatedMessage("notification.friend_removed", user_id),
            getTranslatedMessage("notification.friend_removed_by_you", loggedID)
          ]);

          sendNotification(
              "notification",
              "removeFriend",
              loggedID,
              receiverId,
              messageForReceiver,
              { sender_id: loggedID, receiver_id: receiverId }
          );
        }


        sendNotification(
            "notification",
            "removeFriend",
            receiverId,
            loggedID,
            messageForSender,
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
        // alert("Erro ao registrar o desafio. Tente novamente.");
        alert("Err.");
        return;
      }

      const [messageForReceiver, messageForSender] = await Promise.all([
        getTranslatedMessage("notification.challenge_sent", userId),
        getTranslatedMessage("notification.challenge_received", loggedID)
      ]);
  
      // Notificação para o desafiante
      sendNotification(
        "notification",
        "challengeUser",
        userId,
        loggedID,
        messageForReceiver,
        { sender_id: loggedID, receiver_id: userId, match_id: matchId, tournament_id: tournamentId }
      );
  
      // Notificação para o desafiado
      sendNotification(
        "notification",
        "challengeUser",
        loggedID, // ID do remetente (você)
        userId, // ID do destinatário (oponente)
        messageForSender,
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

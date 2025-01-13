import axios from "axios";
import API_BASE_URL from "../../../assets/config/config.js";

const useUserActions = (wsSendNotification) => {
  const addFriend = async (userId) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");
  
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/add-friend/`,
        { friend_id: userId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
  
      // Enviar notificação para o destinatário (userId) e remetente (loggedID)
      wsSendNotification({
        type: "notification",
        action: "addFriend",
        sender_id: loggedID,
        receiver_id: userId, // Destinatário
        message: `Você recebeu uma solicitação de amizade.`,
        payload: { sender_id: loggedID, receiver_id: userId },
      });
  
      wsSendNotification({
        type: "notification",
        action: "addFriend",
        sender_id: userId,
        receiver_id: loggedID, // Remetente
        message: `Você enviou uma solicitação de amizade.`,
        payload: { sender_id: userId, receiver_id: loggedID },
      });
  
      // alert(response.data.message);
    } catch (err) {
      console.error("Erro ao adicionar amigo:", err);
      alert(err.response?.data?.error || "Erro ao adicionar amigo.");
    }
  };

  const blockUser = async (userId) => {
      const accessToken = localStorage.getItem("access");
      const loggedID = localStorage.getItem("id");

      try {
          const response = await axios.post(
              `${API_BASE_URL}/api/chat/block-user/`,
              { user_id: userId },
              { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          // Enviar notificação para o usuário bloqueado
          wsSendNotification({
              type: "notification",
              action: "blockUser",
              sender_id: loggedID,
              receiver_id: userId, // O usuário bloqueado
              message: `Você foi bloqueado.`,
              payload: { sender_id: loggedID, receiver_id: userId },
          });

          // Enviar notificação para quem realizou o bloqueio
          wsSendNotification({
              type: "notification",
              action: "blockUser",
              sender_id: userId,
              receiver_id: loggedID, // Quem realizou o bloqueio
              message: `Você bloqueou o usuário.`,
              payload: { sender_id: userId, receiver_id: loggedID },
          });

          // Remover o alerta
          // alert("Usuário bloqueado com sucesso.");
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

          const { blocker_id, blocked_id } = response.data;
          console.log("ID: " + blocked_id);

          // Enviar notificação para o usuário desbloqueado
          wsSendNotification({
              type: "notification",
              action: "unblockUser",
              sender_id: loggedID,
              receiver_id: blocked_id, // O usuário que foi desbloqueado
              message: `Você foi desbloqueado.`,
              payload: { sender_id: loggedID, receiver_id: blocked_id },
          });

          // Enviar notificação para quem realizou o desbloqueio
          wsSendNotification({
              type: "notification",
              action: "unblockUser",
              sender_id: blocked_id,
              receiver_id: loggedID, // Quem realizou o desbloqueio
              message: `Você desbloqueou o usuário.`,
              payload: { sender_id: blocked_id, receiver_id: loggedID },
          });

          // Remover o alerta
          // alert("Usuário desbloqueado com sucesso.");
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

          // Extraindo friend_id e user_id do retorno da API
          const { friend_id, user_id } = response.data;

          // Envia notificação para quem enviou a solicitação
          wsSendNotification({
              type: "notification",
              action: "acceptFriend",
              sender_id: loggedID, // Quem aceitou a solicitação
              receiver_id: user_id, // Quem enviou a solicitação
              message: `Sua solicitação de amizade foi aceita.`,
              payload: { sender_id: loggedID, receiver_id: user_id },
          });

          // Envia notificação para quem aceitou a solicitação
          wsSendNotification({
              type: "notification",
              action: "acceptFriend",
              sender_id: user_id, // Quem enviou a solicitação
              receiver_id: loggedID, // Quem aceitou a solicitação
              message: `Você aceitou a solicitação de amizade.`,
              payload: { sender_id: user_id, receiver_id: loggedID },
          });

          // Removendo o alerta
          // alert("Solicitação de amizade aceita com sucesso.");
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

          const { user_id, friend_id } = response.data;

          // Determina os valores de sender_id e receiver_id
          const receiver_id = user_id === loggedID ? friend_id : user_id;

          // Envia notificação para quem enviou a solicitação
          wsSendNotification({
              type: "notification",
              action: "rejectFriend",
              sender_id: user_id, // Quem rejeitou a solicitação
              receiver_id: friend_id, // Quem enviou a solicitação
              message: `Sua solicitação de amizade foi rejeitada.`,
              payload: { sender_id: loggedID, receiver_id: receiver_id },
          });

          // Envia notificação para quem rejeitou a solicitação
          wsSendNotification({
              type: "notification",
              action: "rejectFriend",
              sender_id: friend_id, // Quem enviou a solicitação
              receiver_id: user_id, // Quem rejeitou a solicitação
              message: `Você rejeitou a solicitação de amizade.`,
              payload: { sender_id: receiver_id, receiver_id: loggedID },
          });

          // Removendo o alerta
          // alert("Solicitação de amizade rejeitada com sucesso.");
      } catch (err) {
          console.error("Erro ao rejeitar solicitação:", err);
          alert(err.response?.data?.error || "Erro ao rejeitar solicitação.");
      }
  };

  const removeFriend = async (requestId) => {
      const accessToken = localStorage.getItem("access");
      const loggedID = localStorage.getItem("id");
      try {
          const response = await axios.delete(`${API_BASE_URL}/api/chat/remove-friend/`, {
              headers: { Authorization: `Bearer ${accessToken}` },
              data: { id: requestId },
          });

          const { user_id, friend_id } = response.data;

          // Determina os valores de sender_id e receiver_id
          const receiverId = user_id === loggedID ? friend_id : user_id;

          /*console.log("loggedID" + loggedID);
          console.log("user_id" + user_id);
          console.log("friend_id" + friend_id);*/

          // Envia notificação para quem foi removido
          wsSendNotification({
              type: "notification",
              action: "removeFriend",
              sender_id: friend_id, // Quem removeu a amizade
              receiver_id: user_id, // Quem foi removido
              message: `Você foi removido da lista de amigos.`,
              payload: { sender_id: loggedID, receiver_id: receiverId },
          });

          // Envia notificação para quem removeu
          wsSendNotification({
              type: "notification",
              action: "removeFriend",
              sender_id: user_id, // Quem foi removido
              receiver_id: friend_id, // Quem removeu a amizade
              message: `Você removeu um amigo da sua lista.`,
              payload: { sender_id: receiverId, receiver_id: loggedID },
          });

          // Removendo o alerta
          // alert("Amigo removido com sucesso.");
      } catch (err) {
          console.error("Erro ao remover amigo:", err);
          alert(err.response?.data?.error || "Erro ao remover amigo.");
      }
  };

  const challengeUser = async (userId) => {
    const accessToken = localStorage.getItem("access");
    const loggedID = localStorage.getItem("id");

    try {
      /*await axios.post(
        `${API_BASE_URL}/api/game/challenge-user/`,
        { opponent_id: userId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );*

      wsSendNotification({
        type: "notification",
        action: "challengeUser",
        sender_id: loggedID,
        receiver_id: userId,
        message: `Você desafiou este usuário para uma partida!`,
        payload: { sender_id: loggedID, receiver_id: userId },
      });*/

      alert("Desafio enviado com sucesso!");
    } catch (err) {
      console.error("Erro ao desafiar usuário:", err);
      alert(err.response?.data?.error || "Erro ao desafiar usuário.");
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

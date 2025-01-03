import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../template/Navbar";
import "../../assets/styles/userProfile.css";
import API_BASE_URL, { API_BASE_URL_NO_LANGUAGE } from "../../assets/config/config.js";

import ProfileHeader from "./components/ProfileHeader";
import ProfileInfo from "./components/ProfileInfo";
import ProfileActions from "./components/ProfileActions";
import MatchHistory from "./components/MatchHistory";

import { useWebSocket } from "../webSocket/WebSocketProvider.jsx";

const UserProfile = () => {
  const { wsSendMessage, wsReceiveMessage } = useWebSocket(); // WebSocket hooks
  const { user_id } = useParams();
  const [user, setUser] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [error, setError] = useState(null);
  const defaultAvatar = `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`;
  const [friendshipId, setFriendshipId] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockerId, setBlockerId] = useState(null);
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [blockedRecordId, setBlockedRecordId] = useState(null);
  const [receiverFriendId, setReceiverFriendId] = useState(null);
  const [inviterFriendId, setInviterFriendId] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const accessToken = localStorage.getItem("access");
        const loggedId = localStorage.getItem("id");
        setLoggedUserId(loggedId);

        if (!accessToken) {
          setError("Access token não encontrado.");
          return;
        }

        if (parseInt(loggedId, 10) === parseInt(user_id, 10)) {
          setIsOwnProfile(true);
        }

        const userResponse = await axios.get(`${API_BASE_URL}/api/user-management/user-profile/${user_id}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setUser(userResponse.data);

        const matchResponse = await axios.get(`${API_BASE_URL}/api/user-management/match-history/${user_id}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setMatchHistory(matchResponse.data);

        const relationshipResponse = await axios.get(`${API_BASE_URL}/api/user-management/relationship/${user_id}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setFriendshipId(relationshipResponse.data.friendship_id);
        setFriendshipStatus(relationshipResponse.data.status);
        setIsBlocked(relationshipResponse.data.is_blocked);
        setBlockerId(relationshipResponse.data.blocker_id);
        setBlockedRecordId(relationshipResponse.data.blocked_record_id);
        setInviterFriendId(relationshipResponse.data.user_id);
        setReceiverFriendId(relationshipResponse.data.friend_id);
      } catch (err) {
        setError("Erro ao carregar o perfil do usuário ou informações de relacionamento.");
        console.error(err);
      }
    };

    fetchUserProfile();

    // Recebendo notificações via WebSocket
    wsReceiveMessage((message) => {
      const { type, action, payload } = message;

      if (type === "notification") {
        switch (action) {
          case "addFriend":
            if (payload.receiver_id === loggedUserId || payload.sender_id === loggedUserId) {
              setFriendshipStatus("pending");
            }
            break;
          case "blockUser":
            if (payload.receiver_id === loggedUserId) {
              setIsBlocked(true);
            }
            break;
          case "unblockUser":
            if (payload.receiver_id === loggedUserId) {
              setIsBlocked(false);
            }
            break;
          case "acceptFriend":
            if (payload.receiver_id === loggedUserId || payload.sender_id === loggedUserId) {
              setFriendshipStatus("accepted");
            }
            break;
          case "removeFriend":
            if (payload.receiver_id === loggedUserId || payload.sender_id === loggedUserId) {
              setFriendshipId(null);
              setFriendshipStatus(null);
            }
            break;
          default:
            break;
        }
      }
    });
  }, [wsReceiveMessage, user_id, loggedUserId]);

  const handleAddFriend = async () => {
    const accessToken = localStorage.getItem("access");
    const loggedUserId = localStorage.getItem("id");
  
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/add-friend/`,
        { friend_id: user_id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
  
      // Enviar notificação para o destinatário (user_id)
      wsSendMessage({
        type: "notification",
        action: "addFriend",
        sender_id: loggedUserId,
        receiver_id: user_id, // Destinatário
        message: `Você recebeu uma solicitação de amizade.`,
        payload: { sender_id: loggedUserId, receiver_id: user_id },
      });
  
      // Enviar notificação para o remetente (loggedUserId)
      wsSendMessage({
        type: "notification",
        action: "addFriend",
        sender_id: user_id,
        receiver_id: loggedUserId, // Remetente
        message: `Você enviou uma solicitação de amizade.`,
        payload: { sender_id: user_id, receiver_id: loggedUserId },
      });
  
      // Atualizar estado para indicar solicitação pendente
      setFriendshipStatus("pending");
    } catch (err) {
      console.error("Erro ao adicionar amigo:", err);
    }
  };
  
  const handleCancelRequest = async () => {
    const accessToken = localStorage.getItem("access");
    const loggedUserId = localStorage.getItem("id");
  
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/chat/remove-friend/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: { id: friendshipId },
        }
      );
  
      const { user_id, friend_id } = response.data;
  
      // Determina quem será o receiver_id
      // const receiver_id = user_id === loggedUserId ? friend_id : user_id;
  
      // Enviar notificação para quem enviou a solicitação
      wsSendMessage({
        type: "notification",
        action: "removeFriend",
        sender_id: user_id, // Quem cancelou a solicitação
        receiver_id: friend_id, // Quem recebeu a solicitação
        message: `Sua solicitação de amizade foi cancelada.`,
        payload: { sender_id: user_id, receiver_id: friend_id },
      });
  
      // Enviar notificação para quem recebeu o cancelamento
      wsSendMessage({
        type: "notification",
        action: "removeFriend",
        sender_id: friend_id, // Quem recebeu o cancelamento
        receiver_id: user_id, // Quem cancelou a solicitação
        message: `Você cancelou a solicitação de amizade.`,
        payload: { sender_id: friend_id, receiver_id: user_id },
      });
  
      // Atualizar estado para refletir o cancelamento
      setFriendshipId(null);
      setFriendshipStatus(null);
    } catch (err) {
      console.error("Erro ao cancelar solicitação de amizade:", err);
    }
  };
  
  const handleBlockUser = async () => {
    const accessToken = localStorage.getItem("access");
    const loggedUserId = localStorage.getItem("id");
  
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/block-user/`,
        { user_id },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
  
      // Enviar notificação para o usuário bloqueado
      wsSendMessage({
        type: "notification",
        action: "blockUser",
        sender_id: loggedUserId, // Quem realizou o bloqueio
        receiver_id: user_id, // O usuário que foi bloqueado
        message: `Você foi bloqueado.`,
        payload: { sender_id: loggedUserId, receiver_id: user_id },
      });
  
      // Enviar notificação para quem realizou o bloqueio
      wsSendMessage({
        type: "notification",
        action: "blockUser",
        sender_id: user_id, // O usuário bloqueado
        receiver_id: loggedUserId, // Quem realizou o bloqueio
        message: `Você bloqueou o usuário.`,
        payload: { sender_id: user_id, receiver_id: loggedUserId },
      });
  
      // Atualizar estado para refletir que o usuário foi bloqueado
      setIsBlocked(true);
    } catch (err) {
      console.error("Erro ao bloquear usuário:", err);
    }
  };

  const handleUnblockUser = async () => {
    const accessToken = localStorage.getItem("access");
    const loggedUserId = localStorage.getItem("id");
  
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/unblock-user/`,
        { blockedRecordId },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
  
      const { blocker_id, blocked_id } = response.data;
  
      // Enviar notificação para o usuário desbloqueado
      wsSendMessage({
        type: "notification",
        action: "unblockUser",
        sender_id: loggedUserId, // Quem realizou o desbloqueio
        receiver_id: blocked_id, // O usuário que foi desbloqueado
        message: `Você foi desbloqueado.`,
        payload: { sender_id: loggedUserId, receiver_id: blocked_id },
      });
  
      // Enviar notificação para quem realizou o desbloqueio
      wsSendMessage({
        type: "notification",
        action: "unblockUser",
        sender_id: blocked_id, // O usuário que foi desbloqueado
        receiver_id: loggedUserId, // Quem realizou o desbloqueio
        message: `Você desbloqueou o usuário.`,
        payload: { sender_id: blocked_id, receiver_id: loggedUserId },
      });
  
      // Atualizar estado para refletir que o usuário foi desbloqueado
      setIsBlocked(false);
    } catch (err) {
      console.error("Erro ao desbloquear usuário:", err);
    }
  };

  const handleRemoveFriend = async () => {
    const accessToken = localStorage.getItem("access");
    const loggedUserId = localStorage.getItem("id");
  
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/chat/remove-friend/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { id: friendshipId },
      });
  
      const { user_id, friend_id } = response.data;
  
      // Determina os valores de sender_id e receiver_id
      // const receiverId = user_id === loggedUserId ? friend_id : user_id;
  
      // Envia notificação para quem foi removido
      wsSendMessage({
        type: "notification",
        action: "removeFriend",
        sender_id: user_id, // Quem removeu a amizade
        receiver_id: friend_id, // Quem foi removido
        message: `Você foi removido da lista de amigos.`,
        payload: { sender_id: user_id, receiver_id: friend_id },
      });
  
      // Envia notificação para quem removeu
      wsSendMessage({
        type: "notification",
        action: "removeFriend",
        sender_id: friend_id, // Quem foi removido
        receiver_id: user_id, // Quem removeu a amizade
        message: `Você removeu um amigo da sua lista.`,
        payload: { sender_id: friend_id, receiver_id: user_id },
      });
  
      // Atualiza o estado local
      setFriendshipId(null);
      setFriendshipStatus(null);
    } catch (err) {
      console.error("Erro ao remover amigo:", err);
    }
  };

  const handleAcceptFriendRequest = async () => {
    try {
      const accessToken = localStorage.getItem("access");
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/accept-friend/`,
        { request_id: friendshipId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
  
      const { user_id, friend_id } = response.data;
  
      // Envia notificação para quem enviou a solicitação
      wsSendMessage({
        type: "notification",
        action: "acceptFriend",
        sender_id: loggedUserId, // Quem aceitou a solicitação
        receiver_id: user_id, // Quem enviou a solicitação
        message: `Sua solicitação de amizade foi aceita.`,
        payload: { sender_id: loggedUserId, receiver_id: user_id },
      });
  
      // Envia notificação para quem aceitou a solicitação
      wsSendMessage({
        type: "notification",
        action: "acceptFriend",
        sender_id: user_id, // Quem enviou a solicitação
        receiver_id: loggedUserId, // Quem aceitou a solicitação
        message: `Você aceitou a solicitação de amizade.`,
        payload: { sender_id: user_id, receiver_id: loggedUserId },
      });
  
      // Atualiza o estado para refletir a nova amizade
      setFriendshipStatus("accepted");
    } catch (err) {
      console.error("Erro ao aceitar solicitação de amizade:", err);
      alert(err.response?.data?.error || "Erro ao aceitar solicitação de amizade.");
    }
  };

  const handleRejectFriendRequest = async () => {
    try {
      const accessToken = localStorage.getItem("access");
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/reject-friend/`,
        { request_id: friendshipId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
  
      const { user_id, friend_id } = response.data;
  
      // Envia notificação para quem enviou a solicitação
      wsSendMessage({
        type: "notification",
        action: "rejectFriend",
        sender_id: loggedUserId, // Quem rejeitou a solicitação
        receiver_id: user_id, // Quem enviou a solicitação
        message: `Sua solicitação de amizade foi rejeitada.`,
        payload: { sender_id: loggedUserId, receiver_id: user_id },
      });
  
      // Envia notificação para quem rejeitou a solicitação
      wsSendMessage({
        type: "notification",
        action: "rejectFriend",
        sender_id: user_id, // Quem enviou a solicitação
        receiver_id: loggedUserId, // Quem rejeitou a solicitação
        message: `Você rejeitou a solicitação de amizade.`,
        payload: { sender_id: user_id, receiver_id: loggedUserId },
      });
  
      // Atualiza o estado local
      setFriendshipId(null);
      setFriendshipStatus(null);
    } catch (err) {
      console.error("Erro ao rejeitar solicitação de amizade:", err);
      alert(err.response?.data?.error || "Erro ao rejeitar solicitação de amizade.");
    }
  };

  if (error) {
    return (
      <div>
        <Navbar />
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Navbar />
        <p>Carregando perfil...</p>
      </div>
    );
  }

  const totalMatches = (user.wins || 0) + (user.losses || 0);
  const winRate = totalMatches > 0 ? ((user.wins / totalMatches) * 100).toFixed(2) : 0;

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <ProfileHeader 
          user={user} 
          avatar={user.avatar ? `${API_BASE_URL_NO_LANGUAGE}${user.avatar}` : defaultAvatar} 
        />
        <ProfileInfo
          user={user}
          totalMatches={totalMatches}
          winRate={winRate}
        />
        <ProfileActions
          user_id={user_id}
          friendshipId={friendshipId}
          friendshipStatus={friendshipStatus}
          isBlocked={isBlocked}
          blockerId={blockerId}
          loggedUserId={loggedUserId}
          inviterFriendId={inviterFriendId}
          receiverFriendId={receiverFriendId}
          isOwnProfile={isOwnProfile}
          blockedRecordId={blockedRecordId}
          handleAddFriend={handleAddFriend}
          handleCancelRequest={handleCancelRequest}
          handleBlockUser={handleBlockUser}
          handleUnblockUser={handleUnblockUser}
          handleRemoveFriend={handleRemoveFriend}
          handleAcceptFriendRequest={handleAcceptFriendRequest}
          handleRejectFriendRequest={handleRejectFriendRequest}
        />
        <MatchHistory matchHistory={matchHistory} />
      </div>
    </>
  );
};

export default UserProfile;

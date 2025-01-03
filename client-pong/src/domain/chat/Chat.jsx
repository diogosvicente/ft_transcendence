import React, { useEffect, useState } from "react";
import Navbar from "../template/Navbar";
import axios from "axios";
import "../../assets/styles/chat.css";
import API_BASE_URL, { API_BASE_URL_NO_LANGUAGE } from "../../assets/config/config.js";

import PlayerLists from "./components/PlayerLists";
import ChatWindow from "./components/ChatWindow";
import { useWebSocket } from "../webSocket/WebSocketProvider.jsx";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Chat = () => {
  const { wsSendMessage, wsReceiveMessage } = useWebSocket();

  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [nonFriends, setNonFriends] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [error, setError] = useState(null);
  const [activeChat, setActiveChat] = useState("global");
  const [chatTabs, setChatTabs] = useState([]); // Para gerenciar abas de chat

  const defaultAvatar = `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`;

  const getAvatar = (avatarPath) => {
    if (!avatarPath) return defaultAvatar;
    if (!avatarPath.startsWith("/media/")) {
      return `${API_BASE_URL_NO_LANGUAGE}/media/${avatarPath}`;
    }
    return `${API_BASE_URL_NO_LANGUAGE}${avatarPath}`;
  };

  const openChatWithUser = (friend) => {
    if (!chatTabs.some((tab) => tab.id === friend.id)) {
      setChatTabs((prev) => [...prev, { id: friend.id, name: friend.display_name }]);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const accessToken = localStorage.getItem("access");
      if (!accessToken) {
        setError("Access token não encontrado.");
        return;
      }

      try {
        const friendsResponse = await axios.get(`${API_BASE_URL}/api/chat/friends/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setFriends(
          (friendsResponse.data.friends || []).map((friend) => ({
            ...friend,
            avatar: getAvatar(friend.avatar),
          }))
        );

        const pendingResponse = await axios.get(`${API_BASE_URL}/api/chat/pending-requests/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setPendingRequests(
          (pendingResponse.data.pending_requests || []).map((request) => ({
            ...request,
            avatar: getAvatar(request.avatar),
          }))
        );

        const blockedResponse = await axios.get(`${API_BASE_URL}/api/chat/blocked-users/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setBlockedUsers(
          (blockedResponse.data.blocked_users || []).map((user) => ({
            ...user,
            avatar: getAvatar(user.avatar),
            blocked_record_id: user.blocked_record_id,
          }))
        );

        const nonFriendsResponse = await axios.get(
          `${API_BASE_URL}/api/user-management/exclude-self/`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const updatedNonFriends = nonFriendsResponse.data.users.map((user) => {
          const avatar = getAvatar(user.avatar);
          return {
            ...user,
            avatar,
          };
        });
        setNonFriends(updatedNonFriends);
      } catch (err) {
        setError("Erro ao buscar a lista de amigos ou não amigos.");
        console.error(err);
      }
    };

    fetchUsers();

    wsReceiveMessage((message) => {
      const { type, action, payload } = message;

      if (type === "notification") {
        switch (action) {
          case "addFriend":
            setPendingRequests((prev) => [...prev, payload]);
            break;
          case "blockUser":
            setBlockedUsers((prev) => [...prev, payload]);
            break;
          case "unblockUser":
            setBlockedUsers((prev) => prev.filter((user) => user.blocked_record_id !== payload.blocked_record_id));
            break;
          case "acceptFriend":
            setFriends((prev) => [...prev, payload]);
            setPendingRequests((prev) => prev.filter((req) => req.id !== payload.requestId));
            break;
          case "rejectFriend":
            setPendingRequests((prev) => prev.filter((req) => req.id !== payload.requestId));
            break;
          case "removeFriend":
            setFriends((prev) => prev.filter((friend) => friend.id !== payload.friendId));
            break;
          default:
            break;
        }
      }
    });
  }, [wsReceiveMessage]);

  const sendChatMessage = (chatId) => {
    if (currentMessage.trim()) {
      const message = {
        chatId,
        text: currentMessage,
        sender: "Você",
      };

      wsSendMessage({
        type: "notification",
        action: "message",
        payload: message,
      });

      setChatMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), message],
      }));

      setCurrentMessage("");
    }
  };

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
      wsSendMessage({
        type: "notification",
        action: "addFriend",
        sender_id: loggedID,
        receiver_id: userId, // Destinatário
        message: `Você recebeu uma solicitação de amizade.`,
        payload: { sender_id: loggedID, receiver_id: userId },
      });
  
      wsSendMessage({
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
          wsSendMessage({
              type: "notification",
              action: "blockUser",
              sender_id: loggedID,
              receiver_id: userId, // O usuário bloqueado
              message: `Você foi bloqueado.`,
              payload: { sender_id: loggedID, receiver_id: userId },
          });

          // Enviar notificação para quem realizou o bloqueio
          wsSendMessage({
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
          wsSendMessage({
              type: "notification",
              action: "unblockUser",
              sender_id: loggedID,
              receiver_id: blocked_id, // O usuário que foi desbloqueado
              message: `Você foi desbloqueado.`,
              payload: { sender_id: loggedID, receiver_id: blocked_id },
          });

          // Enviar notificação para quem realizou o desbloqueio
          wsSendMessage({
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
          wsSendMessage({
              type: "notification",
              action: "acceptFriend",
              sender_id: loggedID, // Quem aceitou a solicitação
              receiver_id: user_id, // Quem enviou a solicitação
              message: `Sua solicitação de amizade foi aceita.`,
              payload: { sender_id: loggedID, receiver_id: user_id },
          });

          // Envia notificação para quem aceitou a solicitação
          wsSendMessage({
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
          wsSendMessage({
              type: "notification",
              action: "rejectFriend",
              sender_id: user_id, // Quem rejeitou a solicitação
              receiver_id: friend_id, // Quem enviou a solicitação
              message: `Sua solicitação de amizade foi rejeitada.`,
              payload: { sender_id: loggedID, receiver_id: receiver_id },
          });

          // Envia notificação para quem rejeitou a solicitação
          wsSendMessage({
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
          wsSendMessage({
              type: "notification",
              action: "removeFriend",
              sender_id: friend_id, // Quem removeu a amizade
              receiver_id: user_id, // Quem foi removido
              message: `Você foi removido da lista de amigos.`,
              payload: { sender_id: loggedID, receiver_id: receiverId },
          });

          // Envia notificação para quem removeu
          wsSendMessage({
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

  return (
    <>
      <Navbar />
      <div className="chat-container">
        <PlayerLists
          friends={friends}
          pendingRequests={pendingRequests}
          blockedUsers={blockedUsers}
          nonFriends={nonFriends}
          setFriends={setFriends}
          setPendingRequests={setPendingRequests}
          setBlockedUsers={setBlockedUsers}
          setNonFriends={setNonFriends}
          openChat={openChatWithUser}
          addFriend={addFriend}
          blockUser={blockUser}
          unblockUser={unblockUser}
          acceptFriendRequest={acceptFriendRequest}
          rejectFriendRequest={rejectFriendRequest}
          removeFriend={removeFriend}
          error={error}
        />
        <ChatWindow
          chatMessages={chatMessages}
          activeChat={activeChat}
          chatTabs={chatTabs}
          setChatTabs={setChatTabs}
          setActiveChat={setActiveChat}
          sendChatMessage={sendChatMessage}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
        />
      </div>
    </>
  );
};

export default Chat;

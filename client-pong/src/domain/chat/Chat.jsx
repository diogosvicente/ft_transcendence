import React, { useEffect, useState } from "react";
import Navbar from "../template/Navbar";
import axios from "axios";
import "../../assets/styles/chat.css";
import API_BASE_URL, { API_BASE_URL_NO_LANGUAGE } from "../../assets/config/config.js";

import PlayerLists from "./components/PlayerLists";
import ChatWindow from "./components/ChatWindow";
import { useWebSocket } from "../webSocket/WebSocketProvider.jsx";

import "react-toastify/dist/ReactToastify.css";

const Chat = () => {
  const {
    wsSendNotificationMessage,
    wsSendChatMessage,
    notifications,
    wsMessages,
    // chatMessages
  } = useWebSocket();

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
    console.log(friend); // Verifica os dados do amigo
    if (!chatTabs.some((tab) => tab.id === friend.user_id)) {
      setChatTabs((prev) => [
        ...prev,
        { id: friend.user_id, name: friend.display_name }, // Usando `user_id` como identificador
      ]);
    }
    setActiveChat(friend.user_id); // Define o ID como ativo
  };

  const closeChatTab = (chatId) => {
    setChatTabs((prev) => prev.filter((tab) => tab.id !== chatId));
    setChatMessages((prev) => {
      const updatedMessages = { ...prev };
      delete updatedMessages[chatId];
      return updatedMessages;
    });
    if (activeChat === chatId) setActiveChat("global");
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
            user_id: friend.user_id, // Certifique-se de que este campo está incluído
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

    // Processar notificações
    notifications?.forEach((notification) => {
      const { action, payload } = notification;

      switch (action) {
        case "addFriend":
          setPendingRequests((prev) => [...prev, payload]);
          break;
        case "blockUser":
          setBlockedUsers((prev) => [...prev, payload]);
          break;
        case "unblockUser":
          setBlockedUsers((prev) =>
            prev.filter((user) => user.blocked_record_id !== payload.blocked_record_id)
          );
          break;
        case "acceptFriend":
          setFriends((prev) => [...prev, payload]);
          setPendingRequests((prev) =>
            prev.filter((req) => req.id !== payload.requestId)
          );
          break;
        case "rejectFriend":
          setPendingRequests((prev) =>
            prev.filter((req) => req.id !== payload.requestId)
          );
          break;
        case "removeFriend":
          setFriends((prev) =>
            prev.filter((friend) => friend.id !== payload.friendId)
          );
          break;
        default:
          break;
      }
    });

    // Processar mensagens do chat
    wsMessages?.forEach((message) => {
      const { sender_id, receiver_id, text, timestamp } = message;
  
      const userId = localStorage.getItem("id");
      const chatId = sender_id === userId ? receiver_id : sender_id;
  
      // Verifica e cria a aba do chat, se necessário
      if (!chatTabs.some((tab) => tab.id === chatId)) {
        setChatTabs((prev) => [
          ...prev,
          { id: chatId, name: `Usuário ${chatId}` }, // Ajuste o nome conforme necessário
        ]);
      }
  
      // Atualiza mensagens
      setChatMessages((prev) => ({
        ...prev,
        [chatId]: [
          ...(prev[chatId] || []),
          {
            sender: sender_id === userId ? "Você" : `Amigo ${sender_id}`,
            text,
            timestamp,
          },
        ],
      }));
    });
  }, [notifications, wsMessages]);

  const sendChatMessage = () => {
    if (!currentMessage.trim()) return; // Ignora mensagens vazias
    if (currentMessage.trim() && activeChat) {
      const userId = localStorage.getItem("id"); // ID do usuário logado

      let receiver_id = null;

      // Determinar o `receiver_id` com base na aba ativa
      if (activeChat === "global") {
        receiver_id = "global"; // Para chat global
      } else {
        const activeFriend = chatTabs.find((tab) => tab.id === activeChat);
        if (activeFriend) {
          receiver_id = activeFriend.id; // ID do destinatário (usado como `receiver_id`)
        }
      }

      const message = {
        chatId: activeChat === "global" ? "global" : activeChat, // ID do chat para o estado local
        text: currentMessage,
        sender: "Você",
        receiver_id, // ID do destinatário
        timestamp: new Date().toISOString(), // Timestamp opcional
      };

      wsSendChatMessage({
        type: "message",
        action: "sendMessage",
        payload: {
          receiver_id, // Enviar `receiver_id` para o backend
          sender_id: userId, // ID do remetente
          text: currentMessage,
          timestamp: message.timestamp,
        },
      });

      // Atualizar mensagens no estado local
      setChatMessages((prev) => ({
        ...prev,
        [message.chatId]: [...(prev[message.chatId] || []), message],
      }));

      setCurrentMessage(""); // Limpar o campo de entrada
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
      wsSendNotificationMessage({
        type: "notification",
        action: "addFriend",
        sender_id: loggedID,
        receiver_id: userId, // Destinatário
        message: `Você recebeu uma solicitação de amizade.`,
        payload: { sender_id: loggedID, receiver_id: userId },
      });
  
      wsSendNotificationMessage({
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
          wsSendNotificationMessage({
              type: "notification",
              action: "blockUser",
              sender_id: loggedID,
              receiver_id: userId, // O usuário bloqueado
              message: `Você foi bloqueado.`,
              payload: { sender_id: loggedID, receiver_id: userId },
          });

          // Enviar notificação para quem realizou o bloqueio
          wsSendNotificationMessage({
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
          wsSendNotificationMessage({
              type: "notification",
              action: "unblockUser",
              sender_id: loggedID,
              receiver_id: blocked_id, // O usuário que foi desbloqueado
              message: `Você foi desbloqueado.`,
              payload: { sender_id: loggedID, receiver_id: blocked_id },
          });

          // Enviar notificação para quem realizou o desbloqueio
          wsSendNotificationMessage({
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
          wsSendNotificationMessage({
              type: "notification",
              action: "acceptFriend",
              sender_id: loggedID, // Quem aceitou a solicitação
              receiver_id: user_id, // Quem enviou a solicitação
              message: `Sua solicitação de amizade foi aceita.`,
              payload: { sender_id: loggedID, receiver_id: user_id },
          });

          // Envia notificação para quem aceitou a solicitação
          wsSendNotificationMessage({
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
          wsSendNotificationMessage({
              type: "notification",
              action: "rejectFriend",
              sender_id: user_id, // Quem rejeitou a solicitação
              receiver_id: friend_id, // Quem enviou a solicitação
              message: `Sua solicitação de amizade foi rejeitada.`,
              payload: { sender_id: loggedID, receiver_id: receiver_id },
          });

          // Envia notificação para quem rejeitou a solicitação
          wsSendNotificationMessage({
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
          wsSendNotificationMessage({
              type: "notification",
              action: "removeFriend",
              sender_id: friend_id, // Quem removeu a amizade
              receiver_id: user_id, // Quem foi removido
              message: `Você foi removido da lista de amigos.`,
              payload: { sender_id: loggedID, receiver_id: receiverId },
          });

          // Envia notificação para quem removeu
          wsSendNotificationMessage({
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
          openChatWithUser={openChatWithUser}
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
          closeChatTab={closeChatTab}
        />
      </div>
    </>
  );
};

export default Chat;

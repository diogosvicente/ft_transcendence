import React, { useEffect, useState } from "react";
import Navbar from "../template/Navbar";
import "../../assets/styles/chat.css";

import useFetchUsers from "./hooks/useFetchUsers";
import useUserActions from "./hooks/useUserActions";
import PlayerLists from "./components/PlayerLists";
import ChatWindow from "./components/ChatWindow";
import { useWebSocket } from "../webSocket/WebSocketProvider.jsx";

import "react-toastify/dist/ReactToastify.css";

const Chat = () => {
  const {
    wsSendNotification,
    notifications,
    shouldResetChatWindow, // Flag para verificar se precisa resetar o ChatWindow
    setShouldResetChatWindow, // Função para resetar a flag após o reset
  } = useWebSocket();

  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [nonFriends, setNonFriends] = useState([]);
  const [error, setError] = useState(null);

  // Estado para armazenar o display_name e avatar
  const [userInfo, setUserInfo] = useState({
    display_name: "",
    avatar: "",
  });

  // Gerenciamento das abas de chat
  const [chatTabs, setChatTabs] = useState([{ id: "global", name: "Chat Global" }]);
  const [activeTab, setActiveTab] = useState("global"); // Aba ativa

  // Função para resetar o estado do ChatWindow
  const resetChatWindow = () => {
    setChatTabs([{ id: "global", name: "Chat Global" }]); // Apenas Chat Global
    setActiveTab("global"); // Aba ativa será o Chat Global
  };

  // Monitora a flag shouldResetChatWindow
  useEffect(() => {
    if (shouldResetChatWindow) {
      resetChatWindow();
      setShouldResetChatWindow(false); // Reseta a flag após o reset
    }
  }, [shouldResetChatWindow, setShouldResetChatWindow]);

  // Função para abrir um chat privado
  const openChatWithUser = (friend) => {
    const roomId = `room_${friend.id}`;
    const chatId = `private_${friend.id}`;

    if (!chatTabs.some((tab) => tab.id === chatId)) {
      setChatTabs((prevTabs) => [
        ...prevTabs,
        { id: chatId, name: friend.display_name, roomId, friend },
      ]);
    }
    setActiveTab(chatId);
  };

  // Função para fechar uma aba de chat
  const closeChatTab = (chatId) => {
    setChatTabs((prevTabs) => prevTabs.filter((tab) => tab.id !== chatId));
    if (activeTab === chatId) {
      setActiveTab("global"); // Volta para o global ao fechar a aba ativa
    }
  };

  useFetchUsers({
    setFriends,
    setPendingRequests,
    setBlockedUsers,
    setNonFriends,
    setError,
    notifications,
  });

  const {
    addFriend,
    blockUser,
    unblockUser,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    challengeUser
  } = useUserActions(wsSendNotification);

  return (
    <>
      <Navbar onUserInfoLoaded={(userInfo) => setUserInfo(userInfo)} />
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
          addFriend={addFriend}
          blockUser={blockUser}
          unblockUser={unblockUser}
          acceptFriendRequest={acceptFriendRequest}
          rejectFriendRequest={rejectFriendRequest}
          removeFriend={removeFriend}
          challengeUser={challengeUser}
          openChatWithUser={openChatWithUser} // Passa a função para abrir o chat privado
          error={error}
        />
        <ChatWindow
          chatTabs={chatTabs} // Passa as abas
          activeTab={activeTab} // Aba ativa
          setActiveTab={setActiveTab} // Função para definir a aba ativa
          closeChatTab={closeChatTab} // Passa a função para fechar as abas
          userInfo={userInfo} // Passa os dados do usuário para o ChatWindow
        />
      </div>
    </>
  );
};

export default Chat;

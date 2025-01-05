import React, { useEffect, useState } from "react";
import Navbar from "../template/Navbar";
import "../../assets/styles/chat.css";

import useUserActions from "./assets/useUserActions";
import useFetchUsers from "./assets/useFetchUsers";
import PlayerLists from "./components/PlayerLists";
import ChatWindow from "./components/ChatWindow";
import { useWebSocket } from "../webSocket/WebSocketProvider.jsx";

import "react-toastify/dist/ReactToastify.css";

const Chat = () => {
  const {
    wsSendNotification,
    notifications,
  } = useWebSocket();

  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [nonFriends, setNonFriends] = useState([]);
  const [error, setError] = useState(null);

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
  } = useUserActions(wsSendNotification);

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
          addFriend={addFriend}
          blockUser={blockUser}
          unblockUser={unblockUser}
          acceptFriendRequest={acceptFriendRequest}
          rejectFriendRequest={rejectFriendRequest}
          removeFriend={removeFriend}
          error={error}
        />
        <ChatWindow />
      </div>
    </>
  );
};

export default Chat;

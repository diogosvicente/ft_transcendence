import { useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../../assets/config/config.js";
import { getAvatar } from "../../../assets/config/config.js";

const useFetchUsers = ({
  setFriends,
  setPendingRequests,
  setBlockedUsers,
  setNonFriends,
  setError,
  notifications,
}) => {
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

    }, [notifications, setFriends, setPendingRequests, setBlockedUsers, setNonFriends, setError]);
};

export default useFetchUsers;
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

const UserProfile = () => {
  
  const { user_id } = useParams();
  const [user, setUser] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [error, setError] = useState(null);
  const defaultAvatar = `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`;
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

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
        
      } catch (err) {
        setError("Erro ao carregar o perfil do usuário ou informações de relacionamento.");
        console.error(err);
      }
    };

    fetchUserProfile();
  }, [user_id, loggedUserId]);

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
          isOwnProfile={isOwnProfile}
        />
        <MatchHistory matchHistory={matchHistory} />
      </div>
    </>
  );
};

export default UserProfile;
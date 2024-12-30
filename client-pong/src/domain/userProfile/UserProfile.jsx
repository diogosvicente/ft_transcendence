import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../template/Navbar";
// import "../../assets/styles/profile.css";
import API_BASE_URL, { API_BASE_URL_NO_LANGUAGE } from "../../assets/config/config.js";

const UserProfile = () => {
  const { user_id } = useParams(); // Obtém o ID do usuário da URL
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const defaultAvatar = `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const accessToken = localStorage.getItem("access");
        if (!accessToken) {
          setError("Access token não encontrado.");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/user-management/user-profile/${user_id}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUser(response.data);
      } catch (err) {
        setError("Erro ao carregar o perfil do usuário.");
        console.error(err);
      }
    };

    fetchUserProfile();
  }, [user_id]);

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

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
        <img
            src={user.avatar ? `${API_BASE_URL_NO_LANGUAGE}${user.avatar}` : defaultAvatar}
            alt={user.display_name}
            className="profile-avatar"
        />
          <h1>{user.display_name}</h1>
          <p>Status: {user.is_online ? "Online" : "Offline"}</p>
        </div>
        <div className="profile-info">
          <h2>Estatísticas</h2>
          <p>Partidas Jogadas: {user.total_matches}</p>
          <p>Vitórias: {user.wins}</p>
          <p>Taxa de Vitória: {user.win_rate}%</p>
          <p>Ranking: {user.rank}</p>
        </div>
        <div className="profile-actions">
          <button title="Adicionar Amigo">➕ Adicionar Amigo</button>
          <button title="Bloquear Usuário">🚫 Bloquear</button>
          <button title="Desafiar para Jogo">🎮 Desafiar</button>
        </div>
      </div>
    </>
  );
};

export default UserProfile;

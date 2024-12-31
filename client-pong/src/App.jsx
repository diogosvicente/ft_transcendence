import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import "./assets/translate/i18n.js"; // Importa a configuração do i18n
import Chat from "./domain/chat/Chat.jsx"; // Substituído para chamar o Chat
import LandingPage from "./domain/landing/LandingPage.jsx";
import Home from "./domain/home/Home.jsx";
import Tournaments from "./domain/tournaments/Tournaments.jsx";
import Profile from "./domain/profile/Profile.jsx";
import Ranking from "./domain/ranking/Ranking.jsx";
import { GameCanvas } from "./domain/game/GameCanvas"; // Importa o componente do jogo
import UserProfile from "./domain/userProfile/UserProfile.jsx"; // Importa o componente UserProfile

function PrivateRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem("access");
  return isAuthenticated ? children : <Navigate to="/" />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <Chat /> {/* Agora o componente Chat será renderizado */}
          </PrivateRoute>
        }
      />
      <Route path="/local-match" element={<GameCanvas />} /> {/* Adiciona a rota para Local Match */}
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/tournaments"
        element={
          <PrivateRoute>
            <Tournaments />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/ranking"
        element={
          <PrivateRoute>
            <Ranking />
          </PrivateRoute>
        }
      />
      <Route
        path="/user-profile/:user_id"
        element={
          <PrivateRoute>
            <UserProfile />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;

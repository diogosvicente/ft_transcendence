import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import "./assets/translate/i18n.js"; // Importa a configuração do i18n
import { JoinChatRoomForm } from "./domain/chat/components/JoinChatRoomForm.jsx";
import Chat from "./domain/chat/containers/Chat.jsx";
import LandingPage from "./domain/landing/LandingPage.jsx";
import Home from "./domain/home/Home.jsx";
import Tournaments from "./domain/tournaments/Tournaments.jsx";
import Profile from "./domain/profile/Profile.jsx";
import History from "./domain/history/History.jsx";
import Friends from "./domain/friends/Friends.jsx";
import { GameCanvas } from "./domain/game/GameCanvas"; // Importa o componente do jogo

function PrivateRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem("access");
  return isAuthenticated ? children : <Navigate to="/" />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/chat" element={<JoinChatRoomForm />} />
      <Route path="/chat/:roomName" element={<Chat />} />
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
        path="/history"
        element={
          <PrivateRoute>
            <History />
          </PrivateRoute>
        }
      />
      <Route
        path="/friends"
        element={
          <PrivateRoute>
            <Friends />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;

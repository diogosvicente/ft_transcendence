import { Route, Routes, Navigate } from "react-router-dom";

import { JoinChatRoomForm } from "./domain/chat/components/JoinChatRoomForm.jsx";
import Chat from "./domain/chat/containers/Chat.jsx";
import LandingPage from "./domain/landing/LandingPage.jsx";
import Dashboard from "./domain/dashboard/Dashboard.jsx";
import Home from "./domain/home/Home.jsx"; // Página inicial que será protegida

// Rota Privada
function PrivateRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem("access"); // Verifica se o usuário está logado

  return isAuthenticated ? children : <Navigate to="/" />; // Redireciona para a página de login se não estiver autenticado
}

// Configuração das rotas
function App() {
  return (
    <Routes>
      {/* Página pública: Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Página pública: Formulário para entrar em uma sala de chat */}
      <Route path="/chat" element={<JoinChatRoomForm />} />

      {/* Página pública: Chat Room */}
      <Route path="/chat/:roomName" element={<Chat />} />

      {/* Página protegida: Página Inicial (Home) */}
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />

      {/* Página protegida: Dashboard */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;

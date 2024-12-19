import { Route, Routes, Navigate } from "react-router-dom";

import { JoinChatRoomForm } from "./domain/chat/components/JoinChatRoomForm.jsx";
import Chat from "./domain/chat/containers/Chat.jsx";
import LandingPage from "./domain/landing/LandingPage.jsx";
import Dashboard from "./domain/dashboard/Dashboard.jsx";

function PrivateRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem("access"); // Verifica se o usuário está logado

  return isAuthenticated ? children : <Navigate to="/" />; // Redireciona para a página de login se não estiver autenticado
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/chat" element={<JoinChatRoomForm />} />
      <Route path="chat/:roomName" element={<Chat />} />
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

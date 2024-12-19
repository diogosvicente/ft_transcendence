import React from "react";
import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove os tokens e o email do localStorage
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("email");

    // Redireciona para a página de login
    navigate("/");
  };

  const email = localStorage.getItem("email"); // Obtém o email do usuário logado

  return (
    <div className="vh-100 d-flex justify-content-center align-items-center">
      <Container className="text-center">
        <h1>Bem-vindo, {email}!</h1>
        <Button variant="danger" className="mt-4" onClick={handleLogout}>
          Logout
        </Button>
      </Container>
    </div>
  );
};

export default Dashboard;

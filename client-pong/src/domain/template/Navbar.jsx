import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Navbar, Nav, Button, Container, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const CustomNavbar = () => {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    // Obtém o email do usuário logado
    const email = localStorage.getItem("email");
    const defaultAvatar = "http://127.0.0.1:8000/media/avatars/default.png"; // URL completa da imagem padrão

    if (email) {
      // Faz a requisição ao backend para obter o avatar
      fetch(`http://127.0.0.1:8000/api/user-management/avatar?email=${email}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erro ao buscar o avatar");
          }
          return response.json();
        })
        .then((data) => {
          // Constrói a URL completa do avatar
          const fullAvatarUrl = `http://127.0.0.1:8000${data.avatar}`;
          setAvatar(fullAvatarUrl || defaultAvatar); // Define o avatar retornado ou o padrão
        })
        .catch(() => {
          setAvatar(defaultAvatar); // Em caso de erro, usa o avatar padrão
        });
    } else {
      setAvatar(defaultAvatar); // Se não houver email, usa o avatar padrão
    }
  }, []);

  const handleLogout = () => {
    // Remove os tokens e o email do localStorage
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("email");

    // Redireciona para a página de login
    navigate("/");
  };

  return (
    <Navbar bg="light" expand="lg" className="border-bottom shadow-sm">
      <Container>
        {/* Lado esquerdo: Avatar e nome "Pong" */}
        <div className="d-flex align-items-center">
          <Image
            src={avatar}
            alt="Avatar"
            roundedCircle
            width="40"
            height="40"
            className="me-2"
          />
          <Navbar.Brand href="/home" className="mb-0">
            Pong Game
          </Navbar.Brand>
        </div>

        {/* Lado direito: Menu e botão de logout */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="me-3">
            <NavLink to="/chat" className="nav-link">
              Chat
            </NavLink>
            <NavLink to="/tournaments" className="nav-link">
              Torneios
            </NavLink>
            <NavLink to="/profile" className="nav-link">
              Perfil
            </NavLink>
            <NavLink to="/history" className="nav-link">
              Histórico
            </NavLink>
            <NavLink to="/friends" className="nav-link">
              Amigos
            </NavLink>
          </Nav>
          <Button variant="outline-secondary" onClick={handleLogout}>
            Sair
          </Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;

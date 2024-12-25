import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Navbar, Nav, Button, Container, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API_BASE_URL, { API_BASE_URL_NO_LANGUAGE } from "../../config/config.js";
import brazilFlag from "../../assets/brazil.png"; // Imagem do Brasil
import spainFlag from "../../assets/spain.png"; // Imagem da Espanha
import ukFlag from "../../assets/unitedkingdon.png"; // Imagem do Reino Unido
import "../../styles/navbar.css"; // Estilo personalizado (adicione o arquivo CSS)

const CustomNavbar = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("email");
    const defaultAvatar = `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`; // URL completa da imagem padrão

    if (email) {
      fetch(`${API_BASE_URL}/api/user-management/avatar?email=${email}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erro ao buscar o avatar");
          }
          return response.json();
        })
        .then((data) => {
          const fullAvatarUrl = `${API_BASE_URL_NO_LANGUAGE}${data.avatar}`;
          setAvatar(fullAvatarUrl || defaultAvatar);
        })
        .catch(() => {
          setAvatar(defaultAvatar);
        });
    } else {
      setAvatar(defaultAvatar);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("email");
    navigate("/");
  };

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
  };

  return (
    <Navbar bg="light" expand="lg" className="border-bottom shadow-sm navbar-custom">
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
          <Navbar.Brand href="/home" className="navbar-brand">
            {t("navbar.app_title")}
          </Navbar.Brand>
        </div>

        {/* Lado direito: Menu e botão de logout */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="me-3">
            <NavLink to="/chat" className="nav-link">
              {t("navbar.chat")}
            </NavLink>
            <NavLink to="/tournaments" className="nav-link">
              {t("navbar.tournaments")}
            </NavLink>
            <NavLink to="/profile" className="nav-link">
              {t("navbar.profile")}
            </NavLink>
            <NavLink to="/history" className="nav-link">
              {t("navbar.history")}
            </NavLink>
            <NavLink to="/friends" className="nav-link">
              {t("navbar.friends")}
            </NavLink>
          </Nav>
          <Button variant="outline-secondary" onClick={handleLogout}>
            {t("navbar.logout")}
          </Button>
        </Navbar.Collapse>
      </Container>

      {/* Seletor de Idioma */}
      <div className="language-selector">
        <img
          src={brazilFlag}
          alt="Português (Brasil)"
          width="30"
          height="20"
          onClick={() => handleLanguageChange("pt_BR")}
          className="language-flag"
        />
        <img
          src={ukFlag}
          alt="English"
          width="30"
          height="20"
          onClick={() => handleLanguageChange("en")}
          className="language-flag"
        />
        <img
          src={spainFlag}
          alt="Español"
          width="30"
          height="20"
          onClick={() => handleLanguageChange("es")}
          className="language-flag"
        />
      </div>
    </Navbar>
  );
};

export default CustomNavbar;

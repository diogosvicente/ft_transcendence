import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Navbar, Nav, Button, Container, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API_BASE_URL, { API_BASE_URL_NO_LANGUAGE } from "../../assets/config/config.js";
import brazilFlag from "../../assets/icons/brazil-flag-round-circle-icon.svg";
import spainFlag from "../../assets/icons/spain-country-flag-round-icon.svg";
import ukFlag from "../../assets/icons/uk-flag-round-circle-icon.svg";
import "../../assets/styles/navbar.css";

// Ícone da raquete de tênis de mesa
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTableTennis } from "@fortawesome/free-solid-svg-icons";

const CustomNavbar = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("email");
    const defaultAvatar = `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`;

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
    <Navbar bg="light" expand="lg" className="navbar-custom">
      <Container>
        {/* Lado esquerdo: Avatar e nome "Pong Game" com a raquete */}
        <div className="d-flex align-items-center">
          <Image
            src={avatar}
            alt="Avatar"
            roundedCircle
            width="40"
            height="40"
            className="me-2"
          />
          <Navbar.Brand href="/home" className="navbar-brand d-flex align-items-center">
            <FontAwesomeIcon icon={faTableTennis} className="me-2" />
            {t("navbar.app_title")}
          </Navbar.Brand>
        </div>

        {/* Botão de hambúrguer para telas pequenas */}
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          className="custom-toggler"
        >
          <span className="toggler-icon"></span>
          <span className="toggler-icon"></span>
          <span className="toggler-icon"></span>
        </Navbar.Toggle>

        <Navbar.Collapse
          id="basic-navbar-nav"
          className="justify-content-end align-items-center custom-collapse"
        >
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
          <div className="d-flex align-items-center">
            <div className="language-selector d-flex gap-2">
              <div
                className="language-card"
                onClick={() => handleLanguageChange("pt_BR")}
              >
                <img
                  src={brazilFlag}
                  alt="Português (Brasil)"
                  className="language-flag"
                />
                <span className="language-text">PT-BR</span>
              </div>
              <div
                className="language-card"
                onClick={() => handleLanguageChange("en")}
              >
                <img
                  src={ukFlag}
                  alt="English"
                  className="language-flag"
                />
                <span className="language-text">EN</span>
              </div>
              <div
                className="language-card"
                onClick={() => handleLanguageChange("es")}
              >
                <img
                  src={spainFlag}
                  alt="Español"
                  className="language-flag"
                />
                <span className="language-text">ES</span>
              </div>
            </div>
            <Button variant="outline-secondary" className="ms-3" onClick={handleLogout}>
              {t("navbar.logout")}
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;

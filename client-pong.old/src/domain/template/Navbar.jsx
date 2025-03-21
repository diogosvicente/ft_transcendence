import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavLink, Link } from "react-router-dom";
import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API_BASE_URL from "../../assets/config/config.js";
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
  const [displayName, setDisplayName] = useState("");

  // Busca informações básicas do usuário (avatar, displayName)
  useEffect(() => {
    const userId = localStorage.getItem("id");
    const accessToken = localStorage.getItem("access");
    const defaultAvatar = `${API_BASE_URL}/media/avatars/default.png`;

    if (userId && accessToken) {
      axios
        .get(`${API_BASE_URL}/api/user-management/user-info/${userId}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          const data = response.data;
          const fullAvatarUrl = data.avatar
            ? `${API_BASE_URL}${data.avatar}`
            : defaultAvatar;
          setAvatar(fullAvatarUrl);
          setDisplayName(data.display_name || "");
        })
        .catch((error) => {
          console.error("Erro ao buscar usuário:", error);
          setAvatar(defaultAvatar);
          setDisplayName("");
        });
    } else {
      setAvatar(defaultAvatar);
      setDisplayName("");
    }
  }, []);

  // Busca o idioma do usuário no banco e atualiza o i18next
  useEffect(() => {
    const userId = localStorage.getItem("id");
    const accessToken = localStorage.getItem("access");

    if (userId && accessToken) {
      axios
        .get(`${API_BASE_URL}/api/user-management/user/${userId}/language/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          const userLang = response.data.current_language;
          if (userLang && userLang !== i18n.language) {
            i18n.changeLanguage(userLang);
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar idioma do usuário:", error);
        });
    }
  }, [i18n]);

  const handleLogout = async () => {
    const accessToken = localStorage.getItem("access");
    const refreshToken = localStorage.getItem("refresh");

    try {
      if (refreshToken) {
        const response = await fetch(`${API_BASE_URL}/api/user-management/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
          console.log("Logout realizado com sucesso.");
        } else {
          console.error("Erro ao realizar logout:", await response.json());
        }
      }
    } catch (error) {
      console.error("Erro na requisição de logout:", error);
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("id");
      navigate("/");
    }
  };

  const handleLanguageChange = (language) => {
    // Altera o idioma no i18next; o evento "languageChanged" atualizará o backend automaticamente
    i18n.changeLanguage(language);
  };

  return (
    <Navbar bg="light" expand="lg" className="navbar-custom">
      <Container>
        <Link to="/" className="user-info-link" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="d-flex align-items-center">
            <img
              src={avatar}
              alt="Avatar"
              className="user-avatar me-3"
              style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }}
            />
            <div>
              <span className="user-title" style={{ fontSize: "1.2rem", fontWeight: "bold", display: "block" }}>
                Jogo Pong <FontAwesomeIcon icon={faTableTennis} className="ms-2" />
              </span>
              <span className="user-greeting" style={{ fontSize: "0.9rem", color: "gray" }}>
                {t("navbar.greeting")}, {displayName}
              </span>
            </div>
          </div>
        </Link>

        <Navbar.Toggle aria-controls="basic-navbar-nav" className="custom-toggler">
          <span className="toggler-icon"></span>
          <span className="toggler-icon"></span>
          <span className="toggler-icon"></span>
        </Navbar.Toggle>

        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end align-items-center custom-collapse">
          <Nav className="me-3">
            <NavLink to="/chat" className="nav-link">
              {t("navbar.chat")}
            </NavLink>
            <NavLink to="/tournaments" className="nav-link">
              {t("navbar.tournaments")}
            </NavLink>
            <NavLink to={`/user-profile/${localStorage.getItem("id")}`} className="nav-link">
              {t("navbar.profile")}
            </NavLink>
            <NavLink to="/ranking" className="nav-link">
              {t("navbar.ranking")}
            </NavLink>
          </Nav>
          <div className="d-flex align-items-center">
            <div className="language-selector d-flex gap-2">
              <div className="language-card" onClick={() => handleLanguageChange("pt_BR")}>
                <img src={brazilFlag} alt="Português (Brasil)" className="language-flag" />
                <span className="language-text">PT-BR</span>
              </div>
              <div className="language-card" onClick={() => handleLanguageChange("en")}>
                <img src={ukFlag} alt="English" className="language-flag" />
                <span className="language-text">EN</span>
              </div>
              <div className="language-card" onClick={() => handleLanguageChange("es")}>
                <img src={spainFlag} alt="Español" className="language-flag" />
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

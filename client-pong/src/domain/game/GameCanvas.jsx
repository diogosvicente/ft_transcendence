import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import brazilFlag from "../../assets/icons/brazil-flag-round-circle-icon.svg";
import spainFlag from "../../assets/icons/spain-country-flag-round-icon.svg";
import ukFlag from "../../assets/icons/uk-flag-round-circle-icon.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad, faTableTennis } from "@fortawesome/free-solid-svg-icons";
import "../../assets/styles/landingPage.css";
import { useTranslation } from "react-i18next";

import { gameCore } from "./gameCore.js";

export function GameCanvas() {
  const { t, i18n } = useTranslation();
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 590;

  useEffect(() => {
    const canvas = canvasRef.current;

    const game = gameCore(canvas);
    game.start();

    return () => {
      // Cleanup: Remove listeners or additional resources
      window.removeEventListener("keydown", game.keyDownHandler);
      window.removeEventListener("keyup", game.keyUpHandler);
    };
  }, []);

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center">
      {/* Seletor de idioma */}
      <div className="language-selector position-absolute top-0 end-0 mt-3 me-3">
        <div className="d-flex gap-3">
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
            <img src={ukFlag} alt="English" className="language-flag" />
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
      </div>

      {/* Título do jogo */}
      <h1 className="mb-4 d-flex align-items-center">
        <FontAwesomeIcon icon={faTableTennis} className="me-2" />
        {t("app_title")}
      </h1>

      {/* Canvas centralizado */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border rounded"
        style={{ backgroundColor: "#fff" }}
      ></canvas>

      {/* Botão para voltar */}
      <button
        onClick={handleBackToHome}
        className="btn btn-dark mt-4"
        style={{ fontWeight: "bold", padding: "10px 20px" }}
      >
        <FontAwesomeIcon icon={faGamepad} className="me-2" />
        {t("back_to_home")}
      </button>
    </div>
  );
}

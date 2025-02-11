import React from "react";
import Navbar from "../template/Navbar";
import useUserInfo from "./hooks/useUserInfo";
import "../../assets/styles/home.css"
import { useTranslation } from "react-i18next";
const Home = () => {
  const { t } = useTranslation();
  const displayName = useUserInfo(); // Hook para obter o display_name do usuário

  return (
    <>
      <Navbar />
      <div className="container mt-5 text-center">
        {/* Saudação ao jogador */}
        <h1 className="h1-greeting">
        {t("homepage.welcome_message")}, <span className="highlighted-name">{displayName}</span>!
        </h1>

        {/* Texto FT_TRANSCENDENCE estilizado */}
        <h2 className="h2-title">FT_TRANSCENDENCE</h2>
        <hr></hr>

        {/* Animação da bola de Pong */}
        <div
          className="pong-ball"
          style={{
            width: "50px",
            height: "50px",
            backgroundColor: "#0072ff",
            borderRadius: "50%",
            margin: "2rem auto",
            animation: "pongBall 2s infinite linear",
          }}
        ></div>
      </div>
      
    </>
  );
};

export default Home;

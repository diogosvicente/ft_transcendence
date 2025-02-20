// client-pong/src/domain/game/GameCanvas.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import brazilFlag from "../../assets/icons/brazil-flag-round-circle-icon.svg";
import spainFlag from "../../assets/icons/spain-country-flag-round-icon.svg";
import ukFlag from "../../assets/icons/uk-flag-round-circle-icon.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad, faTableTennis } from "@fortawesome/free-solid-svg-icons";
import "../../assets/styles/landingPage.css";

// CSS para o bracket (ver exemplo abaixo)
import "../../assets/styles/localGame.css";

import { useTranslation } from "react-i18next";
import { gameCore } from "./gameCore.js";

export function GameCanvas() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // -------------------------
  // Partida Simples
  // -------------------------
  const [singleMatchActive, setSingleMatchActive] = useState(false);
  const singleCanvasRef = useRef(null);
  const singleGameRef = useRef(null);

  const handleStartSingleMatch = () => {
    setSingleMatchActive(true);
  };

  // Sempre que "singleMatchActive" ficar true, iniciamos a partida
  useEffect(() => {
    if (singleMatchActive) {
      const canvas = singleCanvasRef.current;
      // Se já tinha jogo anterior, para
      if (singleGameRef.current) {
        singleGameRef.current.stop();
      }

      const game = gameCore(canvas, {
        onMatchEnd: () => {
          // Quando acaba (alguém fez 5 pontos), paramos o jogo
          game.stop();
        },
      });
      game.start();
      singleGameRef.current = game;
    } else {
      // Se saiu do modo "partida simples", paramos
      if (singleGameRef.current) {
        singleGameRef.current.stop();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleMatchActive]);

  // -------------------------
  // Torneio (3 partidas)
  // -------------------------
  const [tournamentActive, setTournamentActive] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(1);
  const [winnerMatch1, setWinnerMatch1] = useState(null);
  const [winnerMatch2, setWinnerMatch2] = useState(null);
  const [champion, setChampion] = useState(null);

  const tournamentCanvasRef = useRef(null);
  const tournamentGameRef = useRef(null);

  const handleStartTournament = () => {
    // Zera o estado do torneio
    setTournamentActive(true);
    setCurrentMatch(1);
    setWinnerMatch1(null);
    setWinnerMatch2(null);
    setChampion(null);
    // Desativa a partida simples
    setSingleMatchActive(false);
  };

  // Sempre que currentMatch mudar, iniciamos a próxima partida
  // ...
useEffect(() => {
  if (tournamentActive && !champion) {
    // Se já havia um jogo anterior, paramos
    if (tournamentGameRef.current) {
      tournamentGameRef.current.stop();
    }

    if (currentMatch === 1) {
      // Partida 1: PLAYER1 vs PLAYER2
      const game = gameCore(tournamentCanvasRef.current, {
        leftPlayerName: "PLAYER1",
        rightPlayerName: "PLAYER2",
        onMatchEnd: (winner) => {
          game.stop();
          setWinnerMatch1(winner);
          setCurrentMatch(2);
        },
      });
      game.start();
      tournamentGameRef.current = game;
    } else if (currentMatch === 2) {
      // Partida 2: PLAYER3 vs PLAYER4
      const game = gameCore(tournamentCanvasRef.current, {
        leftPlayerName: "PLAYER3",
        rightPlayerName: "PLAYER4",
        onMatchEnd: (winner) => {
          game.stop();
          setWinnerMatch2(winner);
          setCurrentMatch(3);
        },
      });
      game.start();
      tournamentGameRef.current = game;
    } else if (currentMatch === 3) {
      // Partida 3: Final -> winnerMatch1 vs winnerMatch2
      const game = gameCore(tournamentCanvasRef.current, {
        leftPlayerName: winnerMatch1 || "Vencedor P1",
        rightPlayerName: winnerMatch2 || "Vencedor P2",
        onMatchEnd: (winner) => {
          game.stop();
          setChampion(winner);
        },
      });
      game.start();
      tournamentGameRef.current = game;
    }
  }
}, [tournamentActive, currentMatch, champion]);


  // Quando definimos "champion", paramos o jogo final
  useEffect(() => {
    if (champion && tournamentGameRef.current) {
      tournamentGameRef.current.stop();
    }
  }, [champion]);

  // -------------------------
  // Navegação e Idioma
  // -------------------------
  const handleBackToHome = () => {
    // Parar tudo ao sair
    if (singleGameRef.current) singleGameRef.current.stop();
    if (tournamentGameRef.current) tournamentGameRef.current.stop();
    navigate("/");
  };

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="container py-4 d-flex flex-column align-items-center">
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
            <img src={spainFlag} alt="Español" className="language-flag" />
            <span className="language-text">ES</span>
          </div>
        </div>
      </div>

      {/* Título do jogo */}
      <h1 className="mb-4 d-flex align-items-center">
        <FontAwesomeIcon icon={faTableTennis} className="me-2" />
        {t("app_title")}
      </h1>

      {/* Botões de escolha */}
      <div className="mb-4">
        <button className="btn btn-primary me-3" onClick={handleStartSingleMatch}>
          Iniciar Partida Simples
        </button>
        <button className="btn btn-success" onClick={handleStartTournament}>
          Iniciar Torneio
        </button>
      </div>

      {/* PARTIDA SIMPLES */}
      {singleMatchActive && (
        <div className="text-center mb-5">
          <h3>Partida Simples (W|S vs ↑|↓) - Até 5 pontos</h3>
          <canvas
            ref={singleCanvasRef}
            width={800}
            height={400}
            className="border rounded"
            style={{ backgroundColor: "#fff" }}
          ></canvas>
        </div>
      )}

      {/* TORNEIO */}
      {tournamentActive && (
        <div className="text-center">
          <h3>Torneio Local</h3>
          <div className="tournament-bracket">
            {/* Round 1 */}
            <div className="round round1">
              <div
                className={`match ${currentMatch === 1 && !champion ? "current" : ""}`}
              >
                <div className="team">PLAYER1</div>
                <div className="team">PLAYER2</div>
                {winnerMatch1 && <div className="winner">Vencedor: {winnerMatch1}</div>}
              </div>
              <div
                className={`match ${currentMatch === 2 && !champion ? "current" : ""}`}
              >
                <div className="team">PLAYER3</div>
                <div className="team">PLAYER4</div>
                {winnerMatch2 && <div className="winner">Vencedor: {winnerMatch2}</div>}
              </div>
            </div>

            {/* Round 2 (Final) */}
            <div className="round round2">
              <div
                className={`match ${currentMatch === 3 && !champion ? "current" : ""}`}
              >
                <div className="team">{winnerMatch1 || "Vencedor P1"}</div>
                <div className="team">{winnerMatch2 || "Vencedor P2"}</div>
                {champion && <div className="winner">Campeão: {champion}</div>}
              </div>
            </div>
          </div>

          {/* Canvas do torneio (some quando tiver campeão) */}
          {!champion && (
            <div className="mt-4">
              <canvas
                ref={tournamentCanvasRef}
                width={800}
                height={400}
                className="border rounded"
                style={{ backgroundColor: "#fff" }}
              ></canvas>
            </div>
          )}
        </div>
      )}

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

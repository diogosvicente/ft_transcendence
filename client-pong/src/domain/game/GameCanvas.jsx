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

  // (IMPORTANTE) Ao iniciar a Partida Simples, paramos qualquer jogo do torneio
  const handleStartSingleMatch = () => {
    // Se existe um jogo de torneio em execução, paramos
    if (tournamentGameRef.current) {
      tournamentGameRef.current.stop();
      tournamentGameRef.current = null;
    }
    // Desativa o estado do torneio
    setTournamentActive(false);

    // Agora paramos o jogo simples anterior, se houver
    if (singleGameRef.current) {
      singleGameRef.current.stop();
      singleGameRef.current = null;
    }

    // Forçamos singleMatchActive para false e depois true, para recriar o jogo
    setSingleMatchActive(false);
    setTimeout(() => {
      setSingleMatchActive(true);
    }, 0);
  };

  // Ao iniciar a Partida Simples (singleMatchActive = true), cria o jogo
  useEffect(() => {
    if (singleMatchActive) {
      const canvas = singleCanvasRef.current;
      if (singleGameRef.current) {
        singleGameRef.current.stop();
      }
      const game = gameCore(canvas, {
        onMatchEnd: () => {
          game.stop();
        },
      });
      game.start();
      singleGameRef.current = game;
    } else {
      if (singleGameRef.current) {
        singleGameRef.current.stop();
      }
    }
  }, [singleMatchActive]);

  // (IMPORTANTE) Ao iniciar o Torneio, paramos a Partida Simples
  const handleStartTournament = () => {
    // Se existe um jogo simples em execução, paramos
    if (singleGameRef.current) {
      singleGameRef.current.stop();
      singleGameRef.current = null;
    }
    // Desativa a partida simples
    setSingleMatchActive(false);

    // Zera o estado do torneio
    setTournamentActive(true);
    setCurrentMatch(1);
    setWinnerMatch1(null);
    setWinnerMatch2(null);
    setChampion(null);
  };

  // Sempre que currentMatch mudar, iniciamos a próxima partida do torneio
  useEffect(() => {
    if (tournamentActive && !champion) {
      if (tournamentGameRef.current) {
        tournamentGameRef.current.stop();
      }

      if (currentMatch === 1) {
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

  // Navegação e Idioma
  const handleBackToHome = () => {
    if (singleGameRef.current) singleGameRef.current.stop();
    if (tournamentGameRef.current) tournamentGameRef.current.stop();
    navigate("/");
  };

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="container py-4 d-flex flex-column align-items-center">
      {/* Seletor de idioma */}
      <div className="language-selector position-absolute top-0 end-0 mt-3 me-3">
        <div className="d-flex gap-3">
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
      </div>

      {/* Título do jogo */}
      <h1 className="mb-4 d-flex align-items-center">
        <FontAwesomeIcon icon={faTableTennis} className="me-2" />
        {t("app_title")}
      </h1>

      {/* Botões de escolha */}
      <div className="mb-4">
        <button className="btn btn-primary me-3" onClick={handleStartSingleMatch}>
          {t("start_simple_game")}
        </button>
        <button className="btn btn-success" onClick={handleStartTournament}>
          {t("tournament.start_tournament")}
        </button>
      </div>

      {/* PARTIDA SIMPLES */}
      {singleMatchActive && (
        <div className="text-center mb-5">
          <h3>{t("simple_game_title")}</h3>
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
          <h3>{t("tournament.local_tournament")}</h3>
          <div className="tournament-bracket">
            {/* Round 1 */}
            <div className="round round1">
              <div className={`match ${currentMatch === 1 && !champion ? "current" : ""}`}>
                <div className="team">PLAYER1</div>
                <div className="team">PLAYER2</div>
                {winnerMatch1 && <div className="winner">{t("winner")}: {winnerMatch1}</div>}
              </div>
              <div className={`match ${currentMatch === 2 && !champion ? "current" : ""}`}>
                <div className="team">PLAYER3</div>
                <div className="team">PLAYER4</div>
                {winnerMatch2 && <div className="winner">{t("winner")}: {winnerMatch2}</div>}
              </div>
            </div>

            {/* Round 2 (Final) */}
            <div className="round round2">
              <div className={`match ${currentMatch === 3 && !champion ? "current" : ""}`}>
                <div className="team">{winnerMatch1 || `${t("winner")} P1`}</div>
                <div className="team">{winnerMatch2 || `${t("winner")} P2`}</div>
                {champion && <div className="winner">{t("champion")}: {champion}</div>}
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

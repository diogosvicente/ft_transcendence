// TournamentGamePage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import GameRoom from "./components/GameRoom"; // Reutiliza o GameRoom existente
import TournamentMatchQueue from "./components/TournamentMatchQueue"; // Componente para a fila de partidas
import API_BASE_URL from "../../assets/config/config";

const TournamentGamePage = () => {
  const { tournamentId, matchId } = useParams(); // Exemplo de rota: /tournament/:tournamentId/game/:matchId
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState(null);
  const [isPlayer1, setIsPlayer1] = useState(null);
  const [matches, setMatches] = useState([]); // Lista de partidas do torneio
  const accessToken = localStorage.getItem("access");
  const loggedUserId = parseInt(localStorage.getItem("id"), 10);

  // Validação dos parâmetros
  if (!matchId || !tournamentId) {
    console.error("IDs de partida ou torneio não encontrados na URL.");
    return <Navigate to="/" replace />;
  }

  // Busca os dados da partida atual
  useEffect(() => {
    const url = `${API_BASE_URL}/api/game/match/${matchId}/`;
    axios
      .get(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((response) => {
        const data = response.data;
        console.log("Dados da Partida:", data);
        if (loggedUserId === data.player1_id) {
          setIsPlayer1(true);
          console.log("Usuário logado é Player 1");
        } else if (loggedUserId === data.player2_id) {
          setIsPlayer1(false);
          console.log("Usuário logado é Player 2");
        } else {
          console.error("Usuário logado não faz parte desta partida.");
          setMatchData("not_found");
        }
        setMatchData(data);
      })
      .catch((error) => {
        if (error.response?.status === 404) {
          console.error("Partida não encontrada.");
          setMatchData("not_found");
        } else {
          console.error("Erro ao buscar dados da partida:", error);
        }
      });
  }, [matchId, accessToken, loggedUserId]);

  // Busca os dados das partidas do torneio para compor a tabela
  useEffect(() => {
    const url = `${API_BASE_URL}/api/game/tournaments/${tournamentId}/matches/`;
    const fetchMatches = () => {
      axios
        .get(url, { headers: { Authorization: `Bearer ${accessToken}` } })
        .then((response) => {
          setMatches(response.data);
        })
        .catch((error) => {
          console.error("Erro ao buscar partidas do torneio:", error);
        });
    };

    fetchMatches();
    // Atualiza a cada 5 segundos para exibir o status em tempo real
    const interval = setInterval(fetchMatches, 5000);
    return () => clearInterval(interval);
  }, [tournamentId, accessToken]);

  if (matchData === "not_found") {
    return <div>Partida não encontrada ou sem permissão para acessá-la.</div>;
  }

  if (!matchData || isPlayer1 === null) {
    return <div>Carregando informações da partida...</div>;
  }

  return (
    <div className="tournament-game-page" style={{ padding: "1rem" }}>
      <h2>Torneio - Partida Atual</h2>
      {/* Componente responsável pela partida atual */}
      <GameRoom
        matchId={matchId}
        userId={loggedUserId}
        matchData={matchData}
        isPlayer1={isPlayer1}
      />
      {/* Componente que exibe a fila/tabela de partidas do torneio */}
      <TournamentMatchQueue matches={matches} />
    </div>
  );
};

export default TournamentGamePage;

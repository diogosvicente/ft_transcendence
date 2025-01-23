import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import axios from "axios";
import GameRoom from "./components/GameRoom";
import API_BASE_URL from "../../assets/config/config";

const GamePage = () => {
  const { matchId } = useParams(); // Obtém o matchId da URL
  const [matchData, setMatchData] = useState(null); // Dados completos da partida
  const [isPlayer1, setIsPlayer1] = useState(null); // Para saber se o usuário logado é Player 1 ou 2

  // Obtém o token de acesso e o ID do usuário logado do localStorage
  const accessToken = localStorage.getItem("access");
  const loggedUserId = parseInt(localStorage.getItem("id"), 10); // Converte para número

  // Valida o matchId e os dados de autenticação
  if (!matchId) {
    console.error("ID da partida não encontrado na URL.");
    return <Navigate to="/" replace />;
  }

  if (!accessToken || isNaN(loggedUserId)) {
    console.error("Usuário não autenticado ou ID inválido.");
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const url = `${API_BASE_URL}/api/game/match/${matchId}/`;
    console.log("URL da API:", url); // Log para verificar a URL completa
    console.log("Token de acesso:", accessToken); // Log do token para verificar se está correto
    console.log("ID do usuário logado (loggedUserId):", loggedUserId); // Log do ID do usuário logado

    // Buscar os dados completos da partida
    axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        const data = response.data;

        // Logs para depuração
        console.log("Dados da Partida:", data);
        console.log("Player 1 ID:", data.player1_id);
        console.log("Player 2 ID:", data.player2_id);

        // Verifica se o jogador logado é Player 1 ou Player 2
        if (loggedUserId === data.player1_id) {
          setIsPlayer1(true); // O usuário logado é Player 1
          console.log("O usuário logado é: Player 1");
        } else if (loggedUserId === data.player2_id) {
          setIsPlayer1(false); // O usuário logado é Player 2
          console.log("O usuário logado é: Player 2");
        } else {
          console.error("O usuário logado não faz parte desta partida.");
          setMatchData("not_found");
        }

        setMatchData(data); // Salva os dados da partida no estado
      })
      .catch((error) => {
        if (error.response?.status === 404) {
          console.error("Partida não encontrada.");
          setMatchData("not_found");
        } else {
          console.error("Erro ao buscar dados da partida:", error);
        }
      });
  }, [API_BASE_URL, matchId, accessToken, loggedUserId]);

  if (matchData === "not_found") {
    return <div>Partida não encontrada ou você não tem permissão para acessá-la.</div>;
  }

  if (!matchData || isPlayer1 === null) {
    return <div>Carregando informações da partida...</div>;
  }

  // Console.log para depuração dos dados carregados
  console.log("Match Data:", matchData);
  console.log("O usuário logado é:", isPlayer1 ? "Player 1" : "Player 2");

  return (
    <div className="game-page">
      {/* Renderiza o GameRoom com os dados dinâmicos */}
      <GameRoom
        matchId={matchId}
        userId={loggedUserId}
        matchData={matchData} // Passa todos os dados da partida
        isPlayer1={isPlayer1} // Indica se o usuário é o Player 1
      />
    </div>
  );
};

export default GamePage;
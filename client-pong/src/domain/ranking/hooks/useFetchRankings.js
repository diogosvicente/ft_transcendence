import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../../assets/config/config";

const useFetchRankings = () => {
  const [tournamentRanking, setTournamentRanking] = useState([]);
  const [victoriesRanking, setVictoriesRanking] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const accessToken = localStorage.getItem("access");

        if (!accessToken) {
          setError("Token de acesso não encontrado.");
          return;
        }

        // Configuração do cabeçalho de autenticação
        const headers = { Authorization: `Bearer ${accessToken}` };

        // Fetch rankings for tournaments won
        const tournamentResponse = await axios.get(
          `${API_BASE_URL}/api/game/ranking/tournaments/`,
          { headers }
        );

        if (tournamentResponse.data) {
          console.log("Tournament Rankings:", tournamentResponse.data); // Log para verificar o retorno
          setTournamentRanking(tournamentResponse.data);
        }

        // Fetch rankings for most victories
        const victoriesResponse = await axios.get(
          `${API_BASE_URL}/api/user-management/ranking/victories/`,
          { headers }
        );

        if (victoriesResponse.data) {
          console.log("Victories Rankings:", victoriesResponse.data); // Log para verificar o retorno
          setVictoriesRanking(victoriesResponse.data);
        }
      } catch (err) {
        console.error("Erro ao buscar rankings:", err.message);
        setError("Erro ao carregar os rankings. Por favor, tente novamente.");
      }
    };

    fetchRankings();
  }, []); // Dependência vazia para executar apenas na montagem do componente.

  return { tournamentRanking, victoriesRanking, error };
};

export default useFetchRankings;

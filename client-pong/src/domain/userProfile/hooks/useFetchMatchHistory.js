import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../../assets/config/config.js";

const useFetchMatchHistory = (userId) => {
  const [matchHistory, setMatchHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setError("ID do usuário não fornecido.");
      return;
    }

    const fetchMatchHistory = async () => {
      try {
        const accessToken = localStorage.getItem("access");
        if (!accessToken) {
          throw new Error("Token de acesso não encontrado.");
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/game/match-history/${userId}/`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setMatchHistory(response.data);
      } catch (err) {
        setError(err.message || "Erro ao carregar histórico de partidas.");
      }
    };

    fetchMatchHistory();
  }, [userId]);

  return { matchHistory, error };
};

export default useFetchMatchHistory;

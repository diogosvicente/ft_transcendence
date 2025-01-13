import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../../assets/config/config.js";

const useFetchRank = (userId) => {
  const [rank, setRank] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRank = async () => {
      try {
        const accessToken = localStorage.getItem("access");

        if (!accessToken) {
          setError("Token de acesso não encontrado.");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/game/ranking/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const ranking = response.data;

        // Encontra a posição do usuário no ranking
        const userRank = ranking.find((r) => r.id === userId);
        if (userRank) {
          setRank(userRank.position);
        } else {
          setRank("N/A"); // Caso o usuário não esteja classificado
        }
      } catch (err) {
        console.error("Erro ao buscar ranking do usuário:", err);
        setError("Erro ao buscar ranking.");
      }
    };

    fetchRank();
  }, [userId]);

  return { rank, error };
};

export default useFetchRank;

import { useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../../assets/config/config";

const useFetchTournaments = ({ notifications, setTournaments, setError }) => {
  useEffect(() => {
    if (notifications) {
      notifications.forEach((notification) => {
        if (notification.type === "tournament") {
          fetchTournaments(); // Revalida a lista de torneios quando uma notificação chega
        }
      });
    }
  }, [notifications]);

  console.log("Token de autenticação:", localStorage.getItem("access"));


  const fetchTournaments = async () => {
    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      setError("Access token não encontrado.");
      return;
    }
  
    try {
      const response = await axios.get(`${API_BASE_URL}/api/game/tournaments/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("Resposta do servidor:", response.data);
      setTournaments(response.data); // Atualiza a lista de torneios
    } catch (error) {
      console.error("Erro ao buscar torneios:", error);
      setError("Erro ao buscar torneios.");
    }
  };
  
  return { fetchTournaments }; // Retorna a função para reutilização em outros lugares
};

export default useFetchTournaments;

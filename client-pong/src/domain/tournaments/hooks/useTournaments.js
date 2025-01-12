import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../../assets/config/config";

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState("all");
  const [aliases, setAliases] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

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
      const sortedTournaments = response.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setTournaments(sortedTournaments);
    } catch (error) {
      console.error(error);
      setError("Erro ao carregar torneios.");
    }
  };

  const handleViewTournament = async (tournamentId) => {
    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      setError("Access token não encontrado.");
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/game/tournaments/${tournamentId}/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setSelectedTournament(response.data);
      setParticipants(response.data.participants || []);
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error(error);
      setError("Erro ao buscar detalhes do torneio.");
    }
  };

  const handleCreateTournament = async (name, alias) => {
    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      setError("Access token não encontrado.");
      return;
    }

    if (!name || !alias) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/game/tournaments/create/`,
        { name, alias },
        {
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        }
      );
      setTournaments([response.data.tournament, ...tournaments]);
      alert("Torneio criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar torneio:", error.response?.data || error.message);
      if (error.response?.status === 400) {
        alert(`Erro: ${error.response.data.error}`);
      } else {
        alert("Erro ao criar torneio. Tente novamente mais tarde.");
      }
    }
  };

  const handleRegister = async (tournamentId, alias) => {
    console.log("Tournament ID:", tournamentId);
    console.log("Alias recebido:", alias);
  
    if (!alias || alias.trim() === "") {
      alert("O campo 'alias' é obrigatório para se inscrever.");
      return;
    }
  
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/game/tournaments/${tournamentId}/register/`,
        { alias: alias.trim() },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("Resposta do servidor:", response.data);
      alert("Inscrição realizada com sucesso!");
      fetchTournaments(); // Atualizar a lista de torneios
    } catch (error) {
      console.error("Erro ao registrar no torneio:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Erro ao registrar. Tente novamente.");
    }
  };

  const handleStartTournament = async (tournamentId) => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament || tournament.total_participants < 3) {
      alert("O torneio precisa de pelo menos 3 participantes para ser iniciado.");
      return;
    }

    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      alert("Access token não encontrado.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/api/game/tournaments/${tournamentId}/start/`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      alert("Torneio iniciado com sucesso!");
      fetchTournaments(); // Atualizar lista
    } catch (error) {
      console.error(error);
      alert("Erro ao iniciar torneio. Tente novamente.");
    }
  };

  return {
    tournaments,
    selectedTournament,
    participants,
    matches,
    filter,
    aliases,
    error,
    setFilter,
    setSelectedTournament,
    setAliases,
    fetchTournaments,
    handleViewTournament,
    handleCreateTournament,
    handleRegister,
    handleStartTournament,
  };
};

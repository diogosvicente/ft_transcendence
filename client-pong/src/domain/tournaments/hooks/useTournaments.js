import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../../assets/config/config";

export const useTournaments = ({ notifications, wsSendNotification }) => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState("all");
  const [aliases, setAliases] = useState({});
  const [error, setError] = useState(null);

  // Fetch tournaments on initial load
  useEffect(() => {
    fetchTournaments();
  }, []);

  // Handle WebSocket Notifications
  useEffect(() => {
    if (notifications) {
      notifications.forEach((notification) => {
        if (notification.type === "tournament") {
          console.log("Novo torneio detectado via WebSocket:", notification);
  
          // Verifica se o torneio já existe na lista
          const newTournament = notification.tournament;
          setTournaments((prevTournaments) => {
            const exists = prevTournaments.some((tournament) => tournament.id === newTournament.id);
            if (!exists) {
              return [newTournament, ...prevTournaments];
            }
            return prevTournaments; // Retorna a lista original se já existe
          });
        }
  
        if (notification.type === "tournament_update") {
          console.log("Atualização de torneio detectada via WebSocket:", notification);
  
          // Atualiza o torneio específico com os novos dados
          const updatedTournament = notification.tournament;
          setTournaments((prevTournaments) =>
            prevTournaments.map((tournament) =>
              tournament.id === updatedTournament.id
                ? {
                    ...tournament,
                    total_participants: updatedTournament.total_participants ?? tournament.total_participants, // Atualiza participantes
                    status: updatedTournament.status ?? tournament.status, // Atualiza status
                  }
                : tournament
            )
          );
        }
      });
    }
  }, [notifications]);
  

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
      const userId = localStorage.getItem("id"); // Obtém o ID do usuário logado
      if (!userId) {
        setError("ID do usuário não encontrado no localStorage.");
        return;
      }
  
      // Busca o display_name do usuário logado
      const userResponse = await axios.get(
        `${API_BASE_URL}/api/user-management/user-info/${userId}/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
  
      const displayName = userResponse.data.display_name || "Usuário Desconhecido";
  
      // Criação do torneio
      const response = await axios.post(
        `${API_BASE_URL}/api/game/tournaments/create/`,
        { name, alias },
        {
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        }
      );
  
      // Formata a data de criação no padrão dd/mm/aaaa
      const createdAt = new Date().toLocaleDateString("pt-BR");
  
      const createdTournament = {
        ...response.data.tournament,
        created_at: createdAt,
        status: "planned",
        creator_display_name: displayName,
        creator_alias: alias,
        total_participants: 1,
        user_registered: true, // Sempre true para o usuário que criou o torneio
        user_alias: alias,
      };
  
      setTournaments((prevTournaments) => [createdTournament, ...prevTournaments]);
  
      // Notificação via WebSocket para todos os usuários
      wsSendNotification({
        type: "tournament",
        message: `Novo torneio criado: ${createdTournament.name}`,
        tournament: {
          ...createdTournament,
          user_registered: false, // Quem recebe a notificação não está registrado inicialmente
        },
      });
  
      // alert("Torneio criado com sucesso!");
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
  
      // Obtém os dados atualizados do torneio da resposta da API
      const updatedTournament = response.data.tournament;
  
      // Atualiza o torneio específico na lista local
      setTournaments((prevTournaments) =>
        prevTournaments.map((tournament) =>
          tournament.id === tournamentId
            ? {
                ...tournament,
                total_participants: updatedTournament.total_participants, // Atualizado com o valor correto
                user_registered: true,
                user_alias: alias.trim(),
              }
            : tournament
        )
      );

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
      // Envia requisição para iniciar o torneio
      await axios.post(
        `${API_BASE_URL}/api/game/tournaments/${tournamentId}/start/`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
  
      // O WebSocket deve atualizar a lista passivamente, então não precisa de `setTournaments` aqui
      // alert("O torneio foi iniciado com sucesso!");
    } catch (error) {
      console.error("Erro ao iniciar torneio:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Erro ao iniciar torneio. Tente novamente.");
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

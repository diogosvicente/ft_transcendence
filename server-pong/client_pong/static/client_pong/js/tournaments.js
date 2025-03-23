document.addEventListener("DOMContentLoaded", () => {
  console.log("[DEBUG] DOMContentLoaded disparado!");

  // --------------------------------------------------------
  // VARIÁVEIS GLOBAIS
  // --------------------------------------------------------
  let tournaments = [];
  let selectedTournament = null;
  let participants = [];
  let matches = [];
  let currentFilter = "all"; // Pode ser "all", "planned", "ongoing", "completed"

  // Token e ID do usuário obtidos do localStorage (exemplo)
  const token = localStorage.getItem("access");
  const loggedID = parseInt(localStorage.getItem("id") || "0", 10);

  // --------------------------------------------------------
  // FUNÇÃO: authorizedFetch
  // Adiciona o cabeçalho Authorization com Bearer <token>
  // --------------------------------------------------------
  async function authorizedFetch(url, options = {}) {
    if (!token) {
      throw new Error("Token não encontrado. Faça login.");
    }
    if (!options.headers) options.headers = {};
    options.headers["Authorization"] = `Bearer ${token}`;
    console.log(`[DEBUG] authorizedFetch -> '${url}'`, options);
    return fetch(url, options);
  }

  // --------------------------------------------------------
  // FUNÇÃO: loadingTournaments
  // Busca a lista de torneios da API e chama renderTournaments
  // --------------------------------------------------------
  async function loadingTournaments() {
    console.log("[DEBUG] Iniciando loadingTournaments()...");
    try {
      const response = await authorizedFetch("/api/game/tournaments/");
      if (!response.ok) {
        console.error("[DEBUG] Resposta não-OK ao carregar torneios:", response.status);
        return;
      }
      tournaments = await response.json();
      console.log("[DEBUG] Torneios obtidos:", tournaments);

      // Ordena do mais recente para o mais antigo (opcional)
      tournaments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      renderTournaments();
    } catch (error) {
      console.error("[DEBUG] Erro ao carregar torneios:", error);
      document.getElementById("error-message").textContent = "Erro ao carregar torneios.";
    }
  }

  // --------------------------------------------------------
  // FUNÇÃO: renderTournaments
  // Exibe a lista de torneios no <tbody id="tournaments-body">
  // Respeita o filtro (currentFilter)
  // --------------------------------------------------------
  function renderTournaments() {
    const tournamentsBody = document.getElementById("tournaments-body");
    tournamentsBody.innerHTML = "";

    // Filtra se o status do torneio bater com currentFilter (ou "all" = sem filtro)
    const filtered = tournaments.filter(t => (currentFilter === "all" ? true : t.status === currentFilter));

    filtered.forEach((t, idx) => {
      const row = document.createElement("tr");

      // Coluna índice
      const tdIndex = document.createElement("td");
      tdIndex.textContent = (idx + 1).toString();
      row.appendChild(tdIndex);

      // Nome
      const tdName = document.createElement("td");
      tdName.textContent = t.name;
      row.appendChild(tdName);

      // Criador
      const tdCreator = document.createElement("td");
      tdCreator.textContent = t.creator_display_name || "Desconhecido";
      row.appendChild(tdCreator);

      // Data de criação
      const tdCreatedAt = document.createElement("td");
      tdCreatedAt.textContent = t.created_at;
      row.appendChild(tdCreatedAt);

      // Participantes
      const tdParticipants = document.createElement("td");
      tdParticipants.textContent = t.total_participants || 0;
      row.appendChild(tdParticipants);

      // Status
      const tdStatus = document.createElement("td");
      tdStatus.textContent = t.status;
      row.appendChild(tdStatus);

      // Ações
      const tdActions = document.createElement("td");
      // Botão de Detalhes
      const btnDetails = document.createElement("button");
      btnDetails.textContent = "Detalhes";
      btnDetails.addEventListener("click", () => handleViewTournament(t.id));
      tdActions.appendChild(btnDetails);

      // Se status = planned e !user_registered => Botão Inscrever-se
      if (t.status === "planned" && !t.user_registered) {
        const btnRegister = document.createElement("button");
        btnRegister.textContent = "Inscrever-se";
        btnRegister.style.marginLeft = "8px";
        btnRegister.addEventListener("click", () => {
          const alias = prompt("Digite seu alias para este torneio:");
          if (alias && alias.trim() !== "") {
            handleRegister(t.id, alias.trim());
          }
        });
        tdActions.appendChild(btnRegister);
      }

      // Se usuário já inscrito => exibe "Inscrito como: alias"
      if (t.user_registered) {
        const badge = document.createElement("span");
        badge.textContent = `Inscrito como: ${t.user_alias}`;
        badge.style.marginLeft = "8px";
        badge.style.color = "green";
        tdActions.appendChild(badge);
      }

      // Se status=planned, user é criador e >=3 participantes => Botão Iniciar
      if (t.status === "planned" && t.creator_id === loggedID && t.total_participants >= 3) {
        const btnStart = document.createElement("button");
        btnStart.textContent = "Iniciar";
        btnStart.style.marginLeft = "8px";
        btnStart.addEventListener("click", () => handleStartTournament(t.id));
        tdActions.appendChild(btnStart);
      }

      row.appendChild(tdActions);
      tournamentsBody.appendChild(row);
    });
  }

  // --------------------------------------------------------
  // FUNÇÃO: handleViewTournament
  // Busca detalhes (tournament, participants, matches) e exibe
  // --------------------------------------------------------
  async function handleViewTournament(tournamentId) {
    console.log("[DEBUG] handleViewTournament() para ID:", tournamentId);
    try {
      const response = await authorizedFetch(`/api/game/tournaments/${tournamentId}/`);
      if (!response.ok) {
        console.error("[DEBUG] Erro ao buscar detalhes do torneio. Status:", response.status);
        return;
      }
      const data = await response.json();
      selectedTournament = data;
      participants = data.participants || [];
      matches = data.matches || [];

      // Esconde a tabela e mostra a seção de detalhes
      document.getElementById("tournaments-table-section").style.display = "none";
      document.getElementById("tournament-details").style.display = "block";
      renderTournamentDetails();
    } catch (error) {
      console.error("[DEBUG] Erro ao buscar detalhes do torneio:", error);
      document.getElementById("error-message").textContent = "Erro ao buscar detalhes do torneio.";
    }
  }

  // --------------------------------------------------------
  // FUNÇÃO: renderTournamentDetails
  // Renderiza participantes e partidas no DOM
  // --------------------------------------------------------
  function renderTournamentDetails() {
    if (!selectedTournament) return;
    const { tournament } = selectedTournament;
    const detailsInfo = document.getElementById("tournament-details-info");
    const detailsParts = document.getElementById("participants-details");
    const detailsMatches = document.getElementById("matches-details");

    detailsInfo.innerHTML = `
      <p><strong>Nome:</strong> ${tournament.name}</p>
      <p><strong>Status:</strong> ${tournament.status}</p>
      <p><strong>Criado em:</strong> ${tournament.created_at}</p>
      <p><strong>Total de Participantes:</strong> ${participants.length}</p>
    `;

    // --------------------------------------------------------
    // EXIBE BOTÃO "INICIAR PRÓXIMA PARTIDA"
    // Caso o torneio esteja em andamento (ongoing) e o usuário logado seja o criador
    // --------------------------------------------------------
    console.log("✨ testando os valores tournaments: ", tournament);
    if (tournament.status === "ongoing" && tournament.created_by === loggedID) {
      const btnNextMatch = document.createElement("button");
      btnNextMatch.textContent = "Iniciar Próxima Partida";
      btnNextMatch.style.marginRight = "10px";
      btnNextMatch.addEventListener("click", () => {
        handleStartNextMatch(tournament.id);
      });
      // Insere o botão no topo das informações
      detailsInfo.insertAdjacentElement("afterbegin", btnNextMatch);
    }

    // Participantes
    if (participants.length > 0) {
      let partHTML = `<table border="1" cellpadding="6">
        <tr><th>#</th><th>Display Name</th><th>Alias</th><th>Points</th></tr>`;
      participants.forEach((p, idx) => {
        const displayName = p.user ? p.user.display_name : "Desconhecido";
        partHTML += `
          <tr>
            <td>${idx + 1}</td>
            <td>${displayName}</td>
            <td>${p.alias}</td>
            <td>${p.points || 0}</td>
          </tr>`;
      });
      partHTML += `</table>`;
      detailsParts.innerHTML = partHTML;
    } else {
      detailsParts.innerHTML = "<p>Nenhum participante inscrito.</p>";
    }

    // Partidas
    if (matches.length > 0) {
      let matchHTML = `<table border="1" cellpadding="6">
        <tr><th>Partida</th><th>Placar</th><th>Status</th></tr>`;
      matches.forEach((m) => {
        matchHTML += `
          <tr>
            <td>${m.player1_display || "?"} vs ${m.player2_display || "?"}</td>
            <td>${m.score_player1 ?? "-"} : ${m.score_player2 ?? "-"}</td>
            <td>${m.status}</td>
          </tr>`;
      });
      matchHTML += `</table>`;
      detailsMatches.innerHTML = matchHTML;
    } else {
      detailsMatches.innerHTML = "<p>Nenhuma partida cadastrada.</p>";
    }
  }

  // --------------------------------------------------------
  // FUNÇÃO: handleRegister (Inscrever-se)
  // --------------------------------------------------------
  async function handleRegister(tournamentId, alias) {
    try {
      const response = await authorizedFetch(`/api/game/tournaments/${tournamentId}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao registrar no torneio.");
        return;
      }
      const data = await response.json(); // { tournament: {...} }
      // Atualiza localmente
      tournaments = tournaments.map(t => {
        if (t.id === data.tournament.id) {
          return {
            ...t,
            total_participants: data.tournament.total_participants,
            user_registered: true,
            user_alias: alias,
          };
        }
        return t;
      });
      renderTournaments();
      alert("Inscrito com sucesso!");
    } catch (error) {
      console.error("[DEBUG] Erro ao registrar no torneio:", error);
      alert("Erro ao registrar no torneio.");
    }
  }

  // --------------------------------------------------------
  // FUNÇÃO: handleStartTournament (Iniciar torneio)
  // --------------------------------------------------------
  async function handleStartTournament(tournamentId) {
    const t = tournaments.find(t => t.id === tournamentId);
    if (!t || t.total_participants < 3) {
      alert("O torneio precisa de pelo menos 3 participantes para ser iniciado.");
      return;
    }
    try {
      const response = await authorizedFetch(`/api/game/tournaments/${tournamentId}/start/`, {
        method: "POST"
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao iniciar torneio.");
        return;
      }
      alert("Torneio iniciado com sucesso!");
      loadingTournaments();
    } catch (error) {
      console.error("[DEBUG] Erro ao iniciar torneio:", error);
      alert("Erro ao iniciar torneio.");
    }
  }

  // --------------------------------------------------------
  // FUNÇÃO: handleStartNextMatch (Iniciar próxima partida)
  // --------------------------------------------------------
  async function handleStartNextMatch(tournamentId) {
    try {
      // Exemplo de rota: ajuste conforme sua API
      const response = await authorizedFetch('/api/game/tournament/next-match/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: tournamentId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao iniciar a próxima partida.");
        return;
      }
      const data = await response.json();
      alert("Próxima partida iniciada com sucesso!");

      // Atualiza os detalhes do torneio para exibir a nova partida
      handleViewTournament(tournamentId);
    } catch (error) {
      console.error("[DEBUG] Erro ao iniciar a próxima partida:", error);
      alert("Erro ao iniciar a próxima partida.");
    }
  }

  // --------------------------------------------------------
  // FUNÇÃO: handleCreateTournament (Criar torneio)
  // --------------------------------------------------------
  async function handleCreateTournament() {
    const name = document.getElementById("new-tournament-name").value.trim();
    const alias = document.getElementById("new-tournament-alias").value.trim();

    if (!name || !alias) {
      alert("Preencha todos os campos!");
      return;
    }
    try {
      const response = await authorizedFetch("/api/game/tournaments/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, alias }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao criar torneio.");
        return;
      }
      const data = await response.json();
      // Ajuste local do torneio criado
      const createdAt = new Date().toLocaleDateString("pt-BR");
      const createdTournament = {
        ...data.tournament,
        created_at: createdAt,
        status: "planned",
        creator_display_name: "Você",
        creator_alias: alias,
        total_participants: 1,
        user_registered: true,
        user_alias: alias,
      };
      tournaments.unshift(createdTournament);
      renderTournaments();
      document.getElementById("new-tournament-name").value = "";
      document.getElementById("new-tournament-alias").value = "";
      document.getElementById("create-tournament-section").style.display = "none";
      alert(`Torneio '${createdTournament.name}' criado com sucesso!`);
    } catch (error) {
      console.error("[DEBUG] Erro ao criar torneio:", error);
      alert("Erro ao criar torneio.");
    }
  }

  // --------------------------------------------------------
  // FUNÇÃO: initTournaments
  // --------------------------------------------------------
  function initTournaments() {
    console.log("[DEBUG] initTournaments() chamado. Carregando torneios...");
    loadingTournaments();
  }

  // --------------------------------------------------------
  // FUNÇÃO: attachTournamentEvents
  //  Anexa eventos aos elementos do DOM (form, botões, etc.)
  // --------------------------------------------------------
  function attachTournamentEvents() {
    console.log("[DEBUG] Tentando obter elementos essenciais do DOM...");

    // Captura todos os elementos que precisamos
    const errorMsg = document.getElementById("error-message");
    const successMsg = document.getElementById("success-message");
    const toggleCreateFormBtn = document.getElementById("toggle-create-form");
    const createTournamentSection = document.getElementById("create-tournament-section");
    const createTournamentBtn = document.getElementById("create-tournament-btn");
    const tournamentsBody = document.getElementById("tournaments-body");
    const backToListBtn = document.getElementById("back-to-list");

    // Verifica se todos existem
    if (
      !errorMsg ||
      !successMsg ||
      !toggleCreateFormBtn ||
      !createTournamentSection ||
      !createTournamentBtn ||
      !tournamentsBody ||
      !backToListBtn
    ) {
      console.log("[DEBUG] Nem todos os elementos essenciais foram encontrados ainda.");
      return false;
    }

    console.log("[DEBUG] Elementos essenciais encontrados! Anexando eventos...");

    // Botão para exibir/ocultar formulário de criação
    toggleCreateFormBtn.addEventListener("click", () => {
      if (createTournamentSection.style.display === "none" || createTournamentSection.style.display === "") {
        createTournamentSection.style.display = "block";
      } else {
        createTournamentSection.style.display = "none";
      }
    });

    // Botão para criar torneio
    createTournamentBtn.addEventListener("click", () => {
      handleCreateTournament();
    });

    // Botões de filtro
    const btnsFiltro = document.querySelectorAll(".btn-filtro");
    btnsFiltro.forEach((btn) => {
      btn.addEventListener("click", () => {
        currentFilter = btn.getAttribute("data-filter");
        renderTournaments();
      });
    });

    // Botão de voltar para lista
    backToListBtn.addEventListener("click", () => {
      selectedTournament = null;
      participants = [];
      matches = [];
      document.getElementById("tournaments-table-section").style.display = "block";
      document.getElementById("tournament-details").style.display = "none";
      errorMsg.textContent = "";
      successMsg.textContent = "";
    });

    // Se o usuário tem token, inicia a listagem
    if (!token) {
      errorMsg.textContent = "Token não encontrado. Faça login antes.";
    } else {
      initTournaments();
    }

    return true; // Indica que deu certo
  }

  // --------------------------------------------------------
  // MÉTODO DE POLLING
  //  Espera até 5 segundos para achar todos os elementos essenciais
  // --------------------------------------------------------
  const maxWaitTime = 5000; // 5 segundos
  const pollStartTime = Date.now();
  const pollingInterval = setInterval(() => {
    console.log("[DEBUG] Polling: verificando se os elementos essenciais estão no DOM...");

    // Tenta rodar attachTournamentEvents()
    if (attachTournamentEvents()) {
      console.log("[DEBUG] Eventos anexados com sucesso! Encerrando polling.");
      clearInterval(pollingInterval);
    } else {
      // Se não achou tudo, verifica se passou do tempo máximo
      if (Date.now() - pollStartTime > maxWaitTime) {
        console.error("[DEBUG] Tempo esgotado. Elementos essenciais não encontrados no DOM.");
        clearInterval(pollingInterval);
      }
    }
  }, 500);
});

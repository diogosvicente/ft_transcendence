document.addEventListener("DOMContentLoaded", () => {

  // --------------------------------------------------------
  // VARIÁVEIS GLOBAIS
  // --------------------------------------------------------
  let tournaments = [];
  let selectedTournament = null;
  let participants = [];
  let matches = [];
  let currentFilter = "all"; // "all", "planned", "ongoing", "completed"

  // Token e ID do usuário do localStorage
  const token = localStorage.getItem("access");
  const loggedID = parseInt(localStorage.getItem("id") || "0", 10);

  // --------------------------------------------------------
  // FUNÇÃO: formatDate
  // Formata a data para "dia/mes/ano às hh:mm"
  // --------------------------------------------------------
  function formatDate(dateString) {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  }

  // --------------------------------------------------------
  // FUNÇÃO: authorizedFetch
  // --------------------------------------------------------
  async function authorizedFetch(url, options = {}) {
    token2 = localStorage.getItem("access");
    if (!token2) {
      throw new Error("Token não encontrado. Faça login.");
    }
    if (!options.headers) options.headers = {};
    options.headers["Authorization"] = `Bearer ${token2}`;
    return fetch(url, options);
  }

  // --------------------------------------------------------
  // FUNÇÃO: loadingTournaments
  // Exibe o loading e busca os torneios
  // --------------------------------------------------------
  async function loadingTournaments() {
    const loadingEl = document.getElementById("tournaments-loading");
    if (loadingEl) loadingEl.style.display = "block"; // Exibe o loading

    try {
      const response = await authorizedFetch("/api/game/tournaments/");
      if (!response.ok) {
        console.error("[DEBUG] Resposta não-OK ao carregar torneios:", response.status);
        return;
      }
      tournaments = await response.json();

      // Ordena do mais recente para o mais antigo (opcional)
      tournaments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      renderTournaments();
    } catch (error) {
      console.error("[DEBUG] Erro ao carregar torneios:", error);
      document.getElementById("error-message").textContent = "Erro ao carregar torneios.";
    } finally {
      if (loadingEl) loadingEl.style.display = "none";
      const tableSection = document.getElementById("tournaments-table-section");
      if (tableSection) tableSection.style.display = "block";
    }
  }

  // --------------------------------------------------------
  // FUNÇÃO: renderTournaments
  // --------------------------------------------------------
  function renderTournaments() {
    const tournamentsBody = document.getElementById("tournaments-body");
    tournamentsBody.innerHTML = "";

    const filtered = tournaments.filter(t =>
      currentFilter === "all" ? true : t.status === currentFilter
    );

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

      // Data de criação formatada
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
      const btnDetails = document.createElement("button");
      btnDetails.textContent = "Detalhes";
      btnDetails.addEventListener("click", () => handleViewTournament(t.id));
      tdActions.appendChild(btnDetails);

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

      if (t.user_registered) {
        const badge = document.createElement("span");
        badge.textContent = `Inscrito como: ${t.user_alias}`;
        badge.style.marginLeft = "8px";
        badge.style.color = "green";
        tdActions.appendChild(badge);
      }

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
  // --------------------------------------------------------
  async function handleViewTournament(tournamentId) {
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
      <p><strong>Criado em:</strong> ${formatDate(tournament.created_at)}</p>
      <p><strong>Total de Participantes:</strong> ${participants.length}</p>
    `;

    if (tournament.status === "ongoing" && tournament.created_by === loggedID) {
      const btnNextMatch = document.createElement("button");
      btnNextMatch.textContent = "Iniciar Próxima Partida";
      btnNextMatch.style.marginRight = "10px";
      btnNextMatch.addEventListener("click", () => {
        handleStartNextMatch(tournament.id);
      });
      detailsInfo.insertAdjacentElement("afterbegin", btnNextMatch);
    }

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
  // FUNÇÃO: handleRegister
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
      const data = await response.json();
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
  // FUNÇÃO: handleStartTournament
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
      loadingTournaments(); // Recarrega a lista
    } catch (error) {
      alert("Erro ao iniciar torneio.");
    }
  }

  // --------------------------------------------------------
  // FUNÇÃO: handleStartNextMatch
  // --------------------------------------------------------
  async function handleStartNextMatch(tournamentId) {
    try {
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
      handleViewTournament(tournamentId);
    } catch (error) {
      alert("Erro ao iniciar a próxima partida.");
    }
  }

  // --------------------------------------------------------
  // FUNÇÃO: handleCreateTournament
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
      alert("Erro ao criar torneio.");
    }
  }

  // --------------------------------------------------------
  // ENVOLVENDO initTournaments EM window E RECARREGANDO TODOS OS ELEMENTOS
  // --------------------------------------------------------
  window.initTournaments = function () {

    // Reinicia a exibição dos elementos essenciais
    const tableSection = document.getElementById("tournaments-table-section");
    const tournamentDetails = document.getElementById("tournament-details");
    const errorMsg = document.getElementById("error-message");
    const successMsg = document.getElementById("success-message");
    const createTournamentSection = document.getElementById("create-tournament-section");

    if (tableSection) tableSection.style.display = "none";
    if (tournamentDetails) tournamentDetails.style.display = "none";
    if (errorMsg) errorMsg.textContent = "";
    if (successMsg) successMsg.textContent = "";
    if (createTournamentSection) createTournamentSection.style.display = "none";

    // Anexa eventos aos elementos essenciais
    const toggleCreateFormBtn = document.getElementById("toggle-create-form");
    const createTournamentBtn = document.getElementById("create-tournament-btn");
    const btnsFiltro = document.querySelectorAll(".btn-filtro");
    const backToListBtn = document.getElementById("back-to-list");

    if (toggleCreateFormBtn && createTournamentSection) {
      toggleCreateFormBtn.addEventListener("click", () => {
        if (createTournamentSection.style.display === "none" || createTournamentSection.style.display === "") {
          createTournamentSection.style.display = "block";
        } else {
          createTournamentSection.style.display = "none";
        }
      });
    }

    if (createTournamentBtn) {
      createTournamentBtn.addEventListener("click", () => {
        handleCreateTournament();
      });
    }

    btnsFiltro.forEach((btn) => {
      btn.addEventListener("click", () => {
        currentFilter = btn.getAttribute("data-filter");
        renderTournaments();
      });
    });

    if (backToListBtn) {
      backToListBtn.addEventListener("click", () => {
        selectedTournament = null;
        participants = [];
        matches = [];
        document.getElementById("tournaments-table-section").style.display = "block";
        document.getElementById("tournament-details").style.display = "none";
        if (errorMsg) errorMsg.textContent = "";
        if (successMsg) successMsg.textContent = "";
      });
    }

    // Inicia o carregamento dos torneios
    loadingTournaments();
  };

  // --------------------------------------------------------
  // FUNÇÃO: attachTournamentEvents
  // Verifica se elementos essenciais existem, anexa eventos e retorna true se tudo estiver presente.
  // --------------------------------------------------------
  function attachTournamentEvents() {

    const errorMsg = document.getElementById("error-message");
    const successMsg = document.getElementById("success-message");
    const toggleCreateFormBtn = document.getElementById("toggle-create-form");
    const createTournamentSection = document.getElementById("create-tournament-section");
    const createTournamentBtn = document.getElementById("create-tournament-btn");
    const tournamentsBody = document.getElementById("tournaments-body");
    const backToListBtn = document.getElementById("back-to-list");

    if (
      !errorMsg ||
      !successMsg ||
      !toggleCreateFormBtn ||
      !createTournamentSection ||
      !createTournamentBtn ||
      !tournamentsBody ||
      !backToListBtn
    ) {
      return false;
    }

    return true;
  }

  // --------------------------------------------------------
  // MÉTODO DE POLLING COM LOADING
  // Enquanto não achar os elementos essenciais, exibe loading.
  // Quando achar, chama attachTournamentEvents() e window.initTournaments()
  // --------------------------------------------------------
  const maxWaitTime = 5000; // 5 segundos
  const pollStartTime = Date.now();
  const pollingInterval = setInterval(() => {

    if (attachTournamentEvents()) {
      const loadingEl = document.getElementById("tournaments-loading");
      if (loadingEl) loadingEl.style.display = "none";
      window.initTournaments();
      clearInterval(pollingInterval);
    } else {
      const loadingEl = document.getElementById("tournaments-loading");
      if (loadingEl) loadingEl.style.display = "block";
      if (Date.now() - pollStartTime > maxWaitTime) {
        clearInterval(pollingInterval);
      }
    }
  }, 500);
});

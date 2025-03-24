(function() {
  console.log("✅ [playerList.js] Carregado...");

  const API_BASE_URL = "http://127.0.0.1:8000";
  const accessToken  = localStorage.getItem("access");

  if (!accessToken) {
    console.warn("⚠️ Sem token de acesso, não será possível carregar a lista de jogadores.");
  }

  // Exponha a função fetchPlayers se quiser chamá-la externamente
  window.fetchPlayers = fetchPlayers;

  // =========================
  // 1) initPlayerList
  // =========================
  window.initPlayerList = function() {
    const loadingEl = document.getElementById("player-list-loading");
    const errorEl   = document.getElementById("player-list-error");
    const contentEl = document.getElementById("player-list-content");
  
    if (loadingEl) loadingEl.classList.remove("d-none");
    if (errorEl)   errorEl.classList.add("d-none");
    if (contentEl) contentEl.classList.add("d-none");
  
    waitForElements(["friends-container", "pending-container", "blocked-container", "non-friends-container"])
      .then(() => {
        if (!accessToken) {
          throw new Error("Sem token de acesso para carregar a lista de jogadores.");
        }

        fetchPlayers(); 
        initializeAccordion();
  
        // Exibe conteúdo, oculta loading
        loadingEl.classList.add("d-none");
        contentEl.classList.remove("d-none");
      })
      .catch(err => {
        console.error("initPlayerList: Erro ao inicializar playerList:", err);
        if (loadingEl) loadingEl.classList.add("d-none");
        if (errorEl) {
          errorEl.textContent = err.message || "Erro ao carregar lista de jogadores.";
          errorEl.classList.remove("d-none");
        }
      });
  };
  

  // =========================
  // 2) Funções auxiliares
  // =========================

  function fetchPlayers() {
    fetchCategory("friends", "friends-container", "Nenhum amigo adicionado.");
    fetchCategory("pending-requests", "pending-container", "Nenhuma solicitação pendente.");
    fetchCategory("blocked-users", "blocked-container", "Nenhum usuário bloqueado.");
    fetchCategory("all-users", "non-friends-container", "Nenhum jogador disponível.");
    fetchBlockedUsersIds();
  }
  
  function fetchCategory(endpoint, containerId, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }
  
    container.innerHTML = `<p>Carregando...</p>`;
    fetch(`${API_BASE_URL}/api/chat/${endpoint}/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then(res => {
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      const key = Object.keys(data)[0] || "";
      renderPlayersList(container, data[key] || [], emptyMessage, endpoint);
    })
    .catch(err => {
      container.innerHTML = `<p>Erro ao carregar dados.</p>`;
    });
  }
  

  function fetchBlockedUsersIds() {
    fetch(`${API_BASE_URL}/api/chat/blocked-users-ids-list/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then(res => res.json())
    .then(data => {
      window.blockedUsers = (data.blocked_users || []).map(id => parseInt(id, 10));
    })
    .catch(err => console.error("Erro ao buscar IDs bloqueados:", err));
  }

  function renderPlayersList(container, items, emptyMessage, endpoint) {
    container.innerHTML = "";
    if (!items || items.length === 0) {
      container.innerHTML = `<p>${emptyMessage}</p>`;
      return;
    }
    const list = document.createElement("ul");
    items.forEach(player => {
      const li = document.createElement("li");
      li.classList.add("player-item");

      const playerName   = player.display_name || "Usuário Desconhecido";
      const playerAvatar = player.avatar || "/media/avatars/default.png";
      const playerStatus = player.online_status ? "Online" : "Offline";
      const statusClass  = player.online_status ? "online" : "offline";
      const realUserId   = player.user_id || player.id;

      li.innerHTML = `
        <div class="player-header">
          <img src="${playerAvatar}" class="user-avatar" />
          <div class="player-details">
            <p class="player-name">${playerName}</p>
            <p class="player-status">
              <span class="status-dot ${statusClass}"></span>
              ${playerStatus}
            </p>
          </div>
        </div>
        <div class="player-actions">
          ${getActionButtons(player, endpoint)}
        </div>
      `;
      list.appendChild(li);
    });
    container.appendChild(list);
  }

  function getActionButtons(player, endpoint) {
    switch (endpoint) {
      case "friends":
        return `
          <button title="Ver Perfil" onclick="viewProfile(${player.user_id})">👤</button>
          <button title="Conversar" onclick="openDirectChat(${player.user_id})">💬</button>
          <button title="Convidar" onclick="inviteToGame(${player.user_id})">🎮</button>
          <button title="Desfazer Amizade" onclick="removeFriend(${player.id})">❌</button>
          <button title="Bloquear" onclick="blockUser(${player.user_id})">🚫</button>
        `;
      case "pending-requests":
        if (player.direction === "received") {
          return `
            <button title="Aceitar" onclick="acceptFriendRequest(${player.id})">✔</button>
            <button title="Rejeitar" onclick="rejectFriendRequest(${player.id})">❌</button>
          `;
        } else {
          return `
            <button title="Cancelar Solicitação" onclick="rejectFriendRequest(${player.id})">❌</button>
          `;
        }
      case "blocked-users":
        return `
          <button title="Ver Perfil" onclick="viewProfile(${player.id})">👤</button>
          <button title="Desbloquear" onclick="unblockUser(${player.blocked_record_id})">🔓</button>
        `;
      case "all-users":
        return `
          <button title="Ver Perfil" onclick="viewProfile(${player.id})">👤</button>
          <button title="Adicionar Amigo" onclick="addFriend(${player.id})">➕</button>
          <button title="Bloquear" onclick="blockUser(${player.id})">🚫</button>
        `;
      default:
        return "";
    }
  }

  function initializeAccordion() {
    document.querySelectorAll(".accordion-header").forEach(header => {
      header.addEventListener("click", () => {
        const content = header.nextElementSibling;
        if (!content) return;
        const isHidden = (content.style.display === "none" || content.style.display === "");
        content.style.display = isHidden ? "block" : "none";
        header.innerHTML = isHidden
          ? header.innerHTML.replace("▶", "▼")
          : header.innerHTML.replace("▼", "▶");
      });
    });
    document.querySelectorAll(".accordion-content").forEach(content => {
      content.style.display = "none";
    });
  }

  // =============== waitForElements (já existente) ===============
  function waitForElements(ids, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
  
      function check() {
        let allFound = true;
  
        for (const id of ids) {
          const element = document.getElementById(id);
          const found = !!element;
          if (!found) {
            allFound = false;
            break; // já sabe que não achou todos
          }
        }
  
        if (allFound) {
          resolve();
        } else if (Date.now() - start > timeout) {
          console.warn("waitForElements: Tempo limite excedido ao buscar elementos:", ids);
          reject(new Error("Timeout esperando elementos de playerList."));
        } else {
          setTimeout(check, 300);
        }
      }
  
      check();
    });
  }
  

})();

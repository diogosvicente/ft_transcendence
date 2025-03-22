(function(){
  console.log("✅ [userAction.js] Carregado...");

  const myId = parseInt(localStorage.getItem("id") || "0", 10);
  window.blockedUsers = window.blockedUsers || []; // lista de IDs bloqueados

  // Mapa de sockets privados: { "private_1_2": WebSocket, ... }
  const privateSockets = {};
  // Socket global (poderá ser setado por chat.js via window.setGlobalSocket)
  let globalSocket = null;

  // Expor globalmente para que chat.js possa setar o socket global
  window.setGlobalSocket = function(socket) {
    globalSocket = socket;
  };

  // ============== TRATAMENTO UNIFICADO DAS MENSAGENS ==============
  window.handleWebSocketMessage = function(roomName, data) {
    // Se for um convite para chat privado, trate a notificação
    if (data.type && data.type === "private_chat_invite") {
      const currentUserId = parseInt(localStorage.getItem("id"), 10);
      if (parseInt(data.target, 10) === currentUserId) {
        // Notifica o usuário e abre automaticamente o chat com o remetente
        alert(`Você recebeu um convite para chat privado de ${data.sender}`);
        window.openDirectChat(data.sender);
      }
      return; // Não processa a mensagem como uma mensagem normal
    }

    // Checar se o remetente está bloqueado
    const senderId = parseInt(data.sender, 10);
    if (window.blockedUsers.includes(senderId)) {
      console.warn(`🚫 Mensagem bloqueada de ${senderId}:`, data.message);
      return;
    }

    if (roomName === "global") {
      renderGlobalMessage(data);
    } else if (roomName.startsWith("private_")) {
      renderPrivateMessage(roomName, data);
    } else {
      console.log(`Sala desconhecida: ${roomName}`, data);
    }
  };

  function renderGlobalMessage(data) {
    const chatMessagesDiv = document.getElementById("chat-messages");
    if (!chatMessagesDiv) return;
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("chat-message");
    msgDiv.innerHTML = `<strong>${data.sender}</strong>: ${data.message}`;
    chatMessagesDiv.appendChild(msgDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
  }

  function renderPrivateMessage(roomName, data) {
    const messagesDiv = document.getElementById(`chat-messages-${roomName}`);
    if (!messagesDiv) {
      console.warn(`Div de mensagens não encontrada para sala: ${roomName}`);
      return;
    }
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("chat-message");
    msgDiv.innerHTML = `<strong>${data.sender}</strong>: ${data.message}`;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // ============== FUNÇÕES PARA CHAT PRIVADO ==============
  window.openDirectChat = function(targetUserId) {
    if (!myId || !targetUserId) {
      console.warn("IDs inválidos para chat privado:", myId, targetUserId);
      return;
    }
    const minId = Math.min(myId, targetUserId);
    const maxId = Math.max(myId, targetUserId);
    const roomName = `private_${minId}_${maxId}`;

    if (!privateSockets[roomName]) {
      // Cria e armazena o socket privado usando a função definida em websocket.js
      privateSockets[roomName] = initializeWebSocket(roomName);
    }
    createPrivateChatTab(roomName, targetUserId);
    switchToPrivateChatTab(roomName);
    // Envia convite para a pessoa alvo
    sendPrivateChatInvite(targetUserId, roomName);
  };

  function createPrivateChatTab(roomName, targetUserId) {
    const chatTabsDiv = document.getElementById("chat-tabs");
    if (!chatTabsDiv) return;
    // Verifica se a aba já existe
    if (chatTabsDiv.querySelector(`.chat-tab[data-room="${roomName}"]`)) return;

    // Cria um botão para a aba, incluindo um span de fechar
    const tabBtn = document.createElement("button");
    tabBtn.classList.add("chat-tab");
    tabBtn.dataset.room = roomName;
    // Define o conteúdo da aba: título + botão fechar
    tabBtn.innerHTML = `Chat c/ ${targetUserId} <span class="close-tab" data-room="${roomName}">&times;</span>`;
    // Clique na aba (exceto no botão de fechar) alterna para essa sala
    tabBtn.addEventListener("click", (e) => {
      if (e.target.classList.contains("close-tab")) return;
      switchToPrivateChatTab(roomName);
    });
    chatTabsDiv.appendChild(tabBtn);

    // Cria o container de mensagens para esse chat privado
    const chatWindow = document.querySelector(".chat-window");
    if (!chatWindow) return;
    const privateDiv = document.createElement("div");
    privateDiv.classList.add("chat-messages");
    privateDiv.id = `chat-messages-${roomName}`;
    privateDiv.style.display = "none"; // Inicialmente oculto
    chatWindow.insertBefore(privateDiv, chatWindow.querySelector(".chat-input"));
  }

  function switchToPrivateChatTab(roomName) {
    document.querySelectorAll(".chat-tab").forEach(tab => {
      tab.classList.remove("active");
    });
    const thisTab = document.querySelector(`.chat-tab[data-room="${roomName}"]`);
    if (thisTab) thisTab.classList.add("active");

    // Oculta todas as divs de mensagens
    document.querySelectorAll(".chat-messages").forEach(div => {
      div.style.display = "none";
    });
    // Exibe o container correspondente à sala ativa
    if (roomName === "global") {
      const globalDiv = document.getElementById("chat-messages");
      if (globalDiv) globalDiv.style.display = "block";
    } else {
      const privateDiv = document.getElementById(`chat-messages-${roomName}`);
      if (privateDiv) {
        privateDiv.style.display = "block";
      } else {
        console.warn("Container de chat privado não encontrado para a sala:", roomName);
      }
    }

    // Redefine o handler do botão "Enviar"
    const sendMessageBtn = document.getElementById("send-message");
    const messageInput = document.getElementById("message-input");
    if (!sendMessageBtn || !messageInput) return;

    // Remove eventListeners antigos clonando o botão
    const newBtn = sendMessageBtn.cloneNode(true);
    sendMessageBtn.parentNode.replaceChild(newBtn, sendMessageBtn);

    // Configura Enter para enviar
    messageInput.onkeydown = null;
    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        newBtn.click();
      }
    });

    if (roomName === "global") {
      newBtn.addEventListener("click", () => {
        alert("A aba global é gerenciada pelo chatGlobal.js. Recarregue ou unifique a lógica se desejar.");
      });
      return;
    }

    newBtn.addEventListener("click", () => {
      const text = messageInput.value.trim();
      if (!text) return;
      const socket = privateSockets[roomName];
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn(`⚠️ Socket privado '${roomName}' não está aberto.`);
        return;
      }
      sendMessageToRoom(socket, roomName, text);
      messageInput.value = "";
    });
  }

  // Função para fechar uma aba de chat privado
  window.closeChatTab = function(roomName) {
    console.log("Fechando aba para a sala:", roomName);
    // Remove a aba do container de abas
    const tab = document.querySelector(`.chat-tab[data-room="${roomName}"]`);
    if (tab) {
      tab.remove();
    }
    // Remove o container de mensagens
    const privateContainer = document.getElementById(`chat-messages-${roomName}`);
    if (privateContainer) {
      privateContainer.remove();
    }
    // Fecha e remove o socket privado, se existir
    if (window.privateSockets && window.privateSockets[roomName]) {
      window.privateSockets[roomName].close();
      delete window.privateSockets[roomName];
    }
    // Se a aba fechada era a ativa, volta para o chat global
    if (window.activeChatRoom === roomName) {
      window.activeChatRoom = "global";
      switchToPrivateChatTab("global");
    }
  };

  // Função para enviar o convite de chat privado para o usuário alvo
  function sendPrivateChatInvite(targetUserId, roomName) {
    if (window.globalSocket && window.globalSocket.readyState === WebSocket.OPEN) {
      const invite = {
        type: "private_chat_invite",
        sender: myId,
        target: targetUserId,
        roomName: roomName,
        message: "Você recebeu um convite para chat privado."
      };
      window.globalSocket.send(JSON.stringify(invite));
      console.log("Convite de chat privado enviado para:", targetUserId);
    } else {
      console.warn("Global socket não está aberto para enviar convite.");
    }
  }

  // Ao abrir um chat privado, envia o convite
  window.openDirectChat = function(targetUserId) {
    if (!myId || !targetUserId) {
      console.warn("IDs inválidos para chat privado:", myId, targetUserId);
      return;
    }
    const minId = Math.min(myId, targetUserId);
    const maxId = Math.max(myId, targetUserId);
    const roomName = `private_${minId}_${maxId}`;
  
    if (!privateSockets[roomName]) {
      privateSockets[roomName] = initializeWebSocket(roomName);
    }
    createPrivateChatTab(roomName, targetUserId);
    switchToPrivateChatTab(roomName);
    // Envia o convite para o usuário alvo
    sendPrivateChatInvite(targetUserId, roomName);
  };

  // ============== FUNÇÕES DE AMIZADE / BLOQUEIO ==============
  const API_BASE_URL = "http://127.0.0.1:8000";
  const accessToken = localStorage.getItem("access");

  window.addFriend = function(targetUserId) {
    fetch(`${API_BASE_URL}/api/chat/add-friend/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ friend_id: targetUserId })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message || data.error || "Solicitação enviada.");
      if (window.fetchPlayers) window.fetchPlayers();
    })
    .catch(err => console.error("Erro ao adicionar amigo:", err));
  };

  window.removeFriend = function(requestId) {
    fetch(`${API_BASE_URL}/api/chat/remove-friend/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ id: requestId })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message || data.error || "Amizade removida.");
      if (window.fetchPlayers) window.fetchPlayers();
    })
    .catch(err => console.error("Erro ao remover amigo:", err));
  };

  window.blockUser = function(targetUserId) {
    fetch(`${API_BASE_URL}/api/chat/block-user/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ user_id: targetUserId })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message || data.error || "Usuário bloqueado.");
      if (window.fetchPlayers) window.fetchPlayers();
    })
    .catch(err => console.error("Erro ao bloquear usuário:", err));
  };

  window.unblockUser = function(blockedRecordId) {
    fetch(`${API_BASE_URL}/api/chat/unblock-user/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ blockedRecordId: blockedRecordId })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message || data.error || "Usuário desbloqueado.");
      if (window.fetchPlayers) window.fetchPlayers();
    })
    .catch(err => console.error("Erro ao desbloquear usuário:", err));
  };

  window.acceptFriendRequest = function(requestId) {
    fetch(`${API_BASE_URL}/api/chat/accept-friend/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ request_id: requestId })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message || data.error || "Solicitação aceita.");
      if (window.fetchPlayers) window.fetchPlayers();
    })
    .catch(err => console.error("Erro ao aceitar solicitação:", err));
  };

  window.rejectFriendRequest = function(requestId) {
    fetch(`${API_BASE_URL}/api/chat/reject-friend/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ request_id: requestId })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message || data.error || "Solicitação rejeitada.");
      if (window.fetchPlayers) window.fetchPlayers();
    })
    .catch(err => console.error("Erro ao rejeitar solicitação:", err));
  };

  // Funções stub para convite e ver perfil
  window.inviteToGame = function(targetUserId) {
    alert(`Função de convite não implementada. ID: ${targetUserId}`);
  };
  window.viewProfile = function(targetUserId) {
    alert(`Ver perfil do usuário ${targetUserId}`);
  };

})();

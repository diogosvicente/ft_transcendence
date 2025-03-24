(function() {
  // Obtém o loggedID do localStorage (como string) e também sua versão numérica para comparações
  const loggedID = localStorage.getItem("id");
  const loggedIDNum = parseInt(loggedID || "0", 10);

  // Variável global para armazenar detalhes dos usuários bloqueados
  window.blockedUsersDetails = window.blockedUsersDetails || [];

  // Socket do chat global
  let globalSocket = null;
  // Objeto para guardar sockets privados: { "private_1_2": WebSocket, ... }
  const privateSockets = {};
  // Sala ativa atualmente ("global" ou "private_x_y")
  let activeChatRoom = "global";

  // Configurações de API
  const API_BASE_URL = "http://127.0.0.1:8000";
  const accessToken = localStorage.getItem("access");

  // Função para enviar notificações via WebSocket
  const sendNotification = (type, action, sender_id, receiver_id, message, payload) => {
    window.WebSocketManager.wsSendNotification({
      type,
      action,
      sender_id,
      receiver_id,
      message,
      payload,
    });
  };

  // ------------------------------------------------------------------
  // Função para buscar a lista completa de bloqueados
  // ------------------------------------------------------------------
  function fetchBlockedUsers() {
    return fetch(`${API_BASE_URL}/api/chat/blocked-users-ids-list/`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro ao buscar bloqueados: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        window.blockedUsersDetails = data.blocked_users || [];
        console.log("🚫 Bloqueados atualizados:", window.blockedUsersDetails);
      })
      .catch(err => console.error("Erro ao buscar lista de bloqueados:", err));
  }

  // ------------------------------------------------------------------
  // Função de polling para aguardar os elementos do chat no DOM
  // ------------------------------------------------------------------
  function waitForChatElements(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      function check() {
        const chatTabsDiv       = document.getElementById("chat-tabs");
        const globalMessagesDiv = document.getElementById("chat-messages");
        const messageInput      = document.getElementById("message-input");
        const sendMessageBtn    = document.getElementById("send-message");

        if (chatTabsDiv && globalMessagesDiv && messageInput && sendMessageBtn) {
          resolve({ chatTabsDiv, globalMessagesDiv, messageInput, sendMessageBtn });
        } else {
          if (Date.now() - start > timeout) {
            reject("Timeout esperando elementos do chat!");
          } else {
            setTimeout(check, 100);
          }
        }
      }
      check();
    });
  }

  // ------------------------------------------------------------------
  // Inicialização Unificada do Chat (com Polling)
  // ------------------------------------------------------------------
  window.initChatGlobal = function() {
    console.log("✅ Iniciando Chat");

    fetchBlockedUsers().then(() => {
      waitForChatElements().then(({ chatTabsDiv, globalMessagesDiv, messageInput, sendMessageBtn }) => {

        // Conecta ao chat global
        globalSocket = initializeWebSocket("global");
        if (!globalSocket) {
          console.error("❌ Falha ao criar socket global. Verifique o token e websocket.js.");
          return;
        }
        globalSocket.roomName = "global";
        globalSocket.onopen   = () => console.log("✅ Conectado ao Chat Global");
        globalSocket.onerror  = (err) => console.error("❌ Erro no Chat Global:", err);
        globalSocket.onclose  = () => console.warn("⚠️ Chat Global fechado.");

        // 1) Envio de Mensagens (clique e tecla Enter)
        function sendMessage() {
          const text = messageInput.value.trim();
          if (!text) return;

          if (activeChatRoom === "global") {
            if (globalSocket.readyState === WebSocket.OPEN) {
              sendMessageToRoom(globalSocket, "global", text);
            } else {
              console.warn("⚠️ Global socket não está OPEN.");
            }
          } else {
            const socket = privateSockets[activeChatRoom];
            if (!socket || socket.readyState !== WebSocket.OPEN) {
              console.warn(`⚠️ Socket privado '${activeChatRoom}' não está OPEN.`);
              return;
            }
            sendMessageToRoom(socket, activeChatRoom, text);
          }
          messageInput.value = "";
        }
  
        sendMessageBtn.addEventListener("click", sendMessage);
        messageInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        });
  
        // 2) Troca e Fechamento de Abas
        chatTabsDiv.addEventListener("click", (e) => {
          const closeBtn = e.target.closest(".close-tab");
          if (closeBtn) {
            const room = closeBtn.getAttribute("data-room");
            closeChatTab(room);
            e.stopPropagation();
            return;
          }
          const tab = e.target.closest(".chat-tab");
          if (tab) {
            const room = tab.getAttribute("data-room");
            switchChatTab(room);
          }
        });
  
        function switchChatTab(roomName) {
          activeChatRoom = roomName;
          document.querySelectorAll(".chat-tab").forEach(tab => tab.classList.remove("active"));
          const activeTab = document.querySelector(`.chat-tab[data-room="${roomName}"]`);
          if (activeTab) activeTab.classList.add("active");
          document.querySelectorAll(".chat-messages").forEach(div => {
            div.style.display = "none";
          });
          if (roomName === "global") {
            globalMessagesDiv.style.display = "block";
          } else {
            const privateDiv = document.getElementById(`chat-messages-${roomName}`);
            if (privateDiv) {
              privateDiv.style.display = "block";
            } else {
              console.warn("Container de chat privado não encontrado:", roomName);
            }
          }
        }
  
        function closeChatTab(roomName) {
          console.log("Fechando aba:", roomName);
          const tab = document.querySelector(`.chat-tab[data-room="${roomName}"]`);
          if (tab) tab.remove();
          const container = document.getElementById(`chat-messages-${roomName}`);
          if (container) container.remove();
          if (privateSockets[roomName]) {
            privateSockets[roomName].close();
            delete privateSockets[roomName];
          }
          if (activeChatRoom === roomName) {
            switchChatTab("global");
          }
        }
  
        switchChatTab("global");
  
        // 3) Recepção de Mensagens
        window.handleWebSocketMessage = function(roomName, data) {
          const senderId = parseInt(data.sender, 10);
          const blocked = window.blockedUsersDetails || [];
          if (!isNaN(senderId) && blocked.some(b => b.id === senderId)) {
            console.warn("🚫 Mensagem bloqueada:", senderId);
            return;
          }
          if (data.type === "private_chat_invite") {
            if (parseInt(data.target, 10) === loggedIDNum) {
              alert(`Você recebeu um convite de chat privado de ${data.sender}`);
              openDirectChat(data.sender);
            }
            return;
          }
          if (roomName === "global") {
            renderGlobalMessage(data);
          } else if (roomName.startsWith("private_")) {
            renderPrivateMessage(roomName, data);
          }
        };
  
        function renderGlobalMessage(data) {
          const msgDiv = document.createElement("div");
          msgDiv.classList.add("chat-message");
          msgDiv.innerHTML = `<strong>${data.display_name}</strong>: ${data.message}`;
          globalMessagesDiv.appendChild(msgDiv);
          globalMessagesDiv.scrollTop = globalMessagesDiv.scrollHeight;
        }
  
        function renderPrivateMessage(roomName, data) {
          const container = document.getElementById(`chat-messages-${roomName}`);
          if (!container) return;
          const msgDiv = document.createElement("div");
          msgDiv.classList.add("chat-message");
          msgDiv.innerHTML = `<strong>${data.display_name}</strong>: ${data.message}`;
          container.appendChild(msgDiv);
          container.scrollTop = container.scrollHeight;
        }
  
        // 4) Abrir Chat Privado
        window.openDirectChat = function(targetUserId) {
          if (!loggedID || !targetUserId) {
            console.warn("IDs inválidos para chat privado:", loggedID, targetUserId);
            return;
          }
          const targetIdNum = parseInt(targetUserId, 10);
          const minId = Math.min(loggedIDNum, targetIdNum);
          const maxId = Math.max(loggedIDNum, targetIdNum);
          const roomName = `private_${minId}_${maxId}`;
  
          if (!privateSockets[roomName]) {
            const socket = initializeWebSocket(roomName);
            if (!socket) {
              console.error("Falha ao criar socket privado.");
              return;
            }
            socket.roomName = roomName;
            privateSockets[roomName] = socket;
          }
  
          createPrivateTab(roomName, targetUserId)
            .then(() => {
              switchChatTab(roomName);
              sendPrivateChatInvite(targetUserId, roomName);
            })
            .catch(err => {
              console.error("Erro ao criar a aba de chat privado:", err);
            });
        };
  
        async function createPrivateTab(roomName, targetUserId) {
          if (document.querySelector(`.chat-tab[data-room="${roomName}"]`)) return;
          const userDisplayName = await getUserDisplayName(targetUserId);
          const chatTabsDiv = document.getElementById("chat-tabs");
          const tab = document.createElement("button");
          tab.classList.add("chat-tab");
          tab.dataset.room = roomName;
          tab.innerHTML = `Chat c/ ${userDisplayName} <span class="close-tab" data-room="${roomName}">&times;</span>`;
          chatTabsDiv.appendChild(tab);
          const chatWindow = document.querySelector(".chat-window");
          if (!chatWindow) return;
          const privateDiv = document.createElement("div");
          privateDiv.classList.add("chat-messages");
          privateDiv.id = `chat-messages-${roomName}`;
          privateDiv.style.display = "none";
          chatWindow.insertBefore(privateDiv, chatWindow.querySelector(".chat-input"));
        }
  
        async function getUserDisplayName(targetUserId) {
          try {
            const friendsResponse = await fetch(`${API_BASE_URL}/api/chat/friends/`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const friendsData = await friendsResponse.json();
            const friendsList = friendsData.friends || [];
            const allUsersResponse = await fetch(`${API_BASE_URL}/api/chat/all-users/`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const allUsersData = await allUsersResponse.json();
            const allUsersList = allUsersData.non_friends || [];
            let user = friendsList.find(u => parseInt(u.user_id, 10) === parseInt(targetUserId, 10));
            if (!user) {
              user = allUsersList.find(u => parseInt(u.id, 10) === parseInt(targetUserId, 10));
            }
            return user ? user.display_name : `Usuário ${targetUserId}`;
          } catch (error) {
            console.error("Erro ao buscar o display name:", error);
            return `Usuário ${targetUserId}`;
          }
        }
  
        function sendPrivateChatInvite(targetUserId, roomName) {
          if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
            const invite = {
              type: "private_chat_invite",
              sender: loggedIDNum,
              target: targetUserId,
              roomName: roomName,
              message: "Você recebeu um convite para chat privado."
            };
            globalSocket.send(JSON.stringify(invite));
          } else {
            console.warn("Global socket não está aberto para enviar convite.");
          }
        }
      })
      .catch(err => {
        console.error("Erro ao aguardar elementos do chat:", err);
      });
    });
  };
  
  // ------------------------------------------------------------------
  // Funções de Amizade/Bloqueio com Notificações utilizando loggedID
  // ------------------------------------------------------------------
  
  window.addFriend = function(targetUserId) {
    fetch(`${API_BASE_URL}/api/chat/add-friend/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ friend_id: targetUserId })
    })
    .then(r => r.json())
    .then(data => {
      alert(data.message || data.error || "Solicitação enviada.");
      sendNotification("notification", "addFriend", loggedID, targetUserId, "Você enviou uma solicitação de amizade.", { sender_id: loggedID, receiver_id: targetUserId });
      sendNotification("notification", "addFriend", loggedID, targetUserId, "Você recebeu uma solicitação de amizade.", { sender_id: loggedID, receiver_id: targetUserId });
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
    .then(r => r.json())
    .then(data => {
      alert(data.message || data.error || "Amizade removida.");
      sendNotification("notification", "removeFriend", loggedID, null, "Amizade removida.", { request_id: requestId });
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
    .then(r => r.json())
    .then(data => {
      alert(data.message || data.error || "Usuário bloqueado.");
      sendNotification("notification", "blockUser", loggedID, targetUserId, "Você bloqueou um usuário.", { sender_id: loggedID, receiver_id: targetUserId });
      sendNotification("notification", "blockUser", loggedID, targetUserId, "Você foi bloqueado.", { sender_id: loggedID, receiver_id: targetUserId });
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
    .then(r => r.json())
    .then(data => {
      alert(data.message || data.error || "Usuário desbloqueado.");
      sendNotification("notification", "unblockUser", loggedID, null, "Usuário desbloqueado.", { blockedRecordId: blockedRecordId });
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
    .then(r => r.json())
    .then(data => {
      // Notificação para o remetente: "Você aceitou uma solicitação de amizade."
      sendNotification("notification", "acceptFriend", loggedID, null, "Você aceitou uma solicitação de amizade.", { request_id: requestId });
      // Notificação para o destinatário: "Sua solicitação foi aceita."
      sendNotification("notification", "acceptFriend", loggedID, null, "Sua solicitação foi aceita.", { request_id: requestId });
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
    .then(r => r.json())
    .then(data => {
      alert(data.message || data.error || "Solicitação rejeitada.");
      // Notificação para o remetente: "Você rejeitou uma solicitação de amizade."
      sendNotification("notification", "rejectFriend", loggedID, null, "Você rejeitou uma solicitação de amizade.", { request_id: requestId });
      // Notificação para o destinatário: "Sua solicitação foi rejeitada."
      sendNotification("notification", "rejectFriend", loggedID, null, "Sua solicitação foi rejeitada.", { request_id: requestId });
      if (window.fetchPlayers) window.fetchPlayers();
    })
    .catch(err => console.error("Erro ao rejeitar solicitação:", err));
  };
  
  window.inviteToGame = async function(targetUserId, tournamentId = null) {
    try {
      const token = localStorage.getItem("access");
      const currentID = localStorage.getItem("id");
  
      const response = await fetch(`${API_BASE_URL}/api/game/challenge-user/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          opponent_id: targetUserId,
          tournament_id: tournamentId
        })
      });
      const data = await response.json();
      const matchId = data.match_id;
      if (!matchId) {
        console.error("match_id não está definido na resposta do backend.");
        alert("Erro ao registrar o desafio. Tente novamente.");
        return;
      }
  
      const messageForReceiver = "Desafio enviado.";
      const messageForSender = "Você recebeu um desafio.";
  
      sendNotification("notification", "inviteToGame", currentID, targetUserId, messageForReceiver, { sender_id: currentID, receiver_id: targetUserId, match_id: matchId, tournament_id: tournamentId });
      sendNotification("notification", "inviteToGame", targetUserId, currentID, messageForSender, { sender_id: targetUserId, receiver_id: currentID, match_id: matchId, tournament_id: tournamentId });
      
    } catch (err) {
      console.error("Erro ao desafiar usuário:", err);
      alert("Erro ao desafiar usuário.");
    }
  };
  
  window.viewProfile = function(targetUserId) {
    window.open(`user-profile/${targetUserId}`, "_blank");
  };

})();

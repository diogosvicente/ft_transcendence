(function() {
  console.log("✅ [chat.js] Carregado...");
  
  // ID do usuário logado (convertido para número)
  const myId = parseInt(localStorage.getItem("id") || "0", 10);

  // Variável global para armazenar detalhes dos usuários bloqueados
  window.blockedUsersDetails = window.blockedUsersDetails || [];

  // Socket do chat global
  let globalSocket = null;
  // Objeto para guardar sockets privados: { "private_1_2": WebSocket, ... }
  const privateSockets = {};
  // Sala ativa atualmente ("global" ou "private_x_y")
  let activeChatRoom = "global";

  // ------------------------------------------------------------------
  // Função para buscar a lista completa de bloqueados
  // ------------------------------------------------------------------
  function fetchBlockedUsers() {
    const API_BASE_URL = "http://127.0.0.1:8000";
    const accessToken  = localStorage.getItem("access");

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
        // data.blocked_users deve ser um array de objetos com id e display_name
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
          // Se todos existem, retornamos esses elementos
          resolve({ chatTabsDiv, globalMessagesDiv, messageInput, sendMessageBtn });
        } else {
          if (Date.now() - start > timeout) {
            reject("Timeout esperando elementos do chat!");
          } else {
            setTimeout(check, 100); // tenta novamente em 100ms
          }
        }
      }
      check();
    });
  }

  // ------------------------------------------------------------------
  // 1) Inicialização Unificada do Chat (Solução 2 com Polling)
  // ------------------------------------------------------------------
  window.initChatGlobal = function() {
    console.log("✅ Iniciando Chat");

    // Primeiro, atualiza a lista de bloqueados
    fetchBlockedUsers().then(() => {

      // Aguarda até que os elementos do chat existam no DOM
      waitForChatElements().then(({ chatTabsDiv, globalMessagesDiv, messageInput, sendMessageBtn }) => {
        console.log("✅ Elementos do chat encontrados, prosseguindo...");

        // ------------------------------------------------------------------
        // (Mantém sua lógica original, sem remover nada desnecessário)
        // ------------------------------------------------------------------

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

        // 2) Envio de Mensagens (clique e Enter)
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

        // 3) Troca e Fechamento de Abas
        chatTabsDiv.addEventListener("click", (e) => {
          // Se clicou no botão de fechar
          const closeBtn = e.target.closest(".close-tab");
          if (closeBtn) {
            const room = closeBtn.getAttribute("data-room");
            closeChatTab(room);
            e.stopPropagation();
            return;
          }
          // Se clicou na aba normal
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

        // Inicia exibindo o chat global
        switchChatTab("global");

        // 4) Recepção de Mensagens
        window.handleWebSocketMessage = function(roomName, data) {
          console.log("DEBUG: Mensagem recebida =>", data);

          // Verificação híbrida: tenta converter data.sender para número
          let senderVal = data.sender;
          let senderId = parseInt(senderVal, 10);
          console.log("DEBUG: senderVal =", senderVal, "senderId =", senderId, "blockedUsersDetails =", window.blockedUsersDetails);

          // Se tiver detalhes de bloqueados, use-os; caso contrário, use o array vazio
          const blocked = window.blockedUsersDetails || [];

          // Se senderId é um número, tenta comparar com o campo id
          if (!isNaN(senderId)) {
            const found = blocked.some(b => b.id === senderId);
            if (found) {
              console.warn("🚫 Mensagem bloqueada pelo ID:", senderId);
              return;
            }
          } else {
            // Senão, compara pelo display_name
            const found = blocked.some(b => b.display_name === senderVal);
            if (found) {
              console.warn("🚫 Mensagem bloqueada pelo nome:", senderVal);
              return;
            }
          }

          // Se for um convite de chat privado
          if (data.type === "private_chat_invite") {
            if (parseInt(data.target, 10) === myId) {
              alert(`Você recebeu um convite de chat privado de ${data.sender}`);
              openDirectChat(data.sender);
            }
            return;
          }

          // Renderiza a mensagem na sala correspondente
          if (roomName === "global") {
            renderGlobalMessage(data);
          } else if (roomName.startsWith("private_")) {
            renderPrivateMessage(roomName, data);
          }
        };

        function renderGlobalMessage(data) {
          console.log("[Global] Mensagem:", data);
          const msgDiv = document.createElement("div");
          msgDiv.classList.add("chat-message");
          msgDiv.innerHTML = `<strong>${data.display_name}</strong>: ${data.message}`;
          globalMessagesDiv.appendChild(msgDiv);
          globalMessagesDiv.scrollTop = globalMessagesDiv.scrollHeight;
        }

        function renderPrivateMessage(roomName, data) {
          const container = document.getElementById(`chat-messages-${roomName}`);
          if (!container) {
            console.warn("Container de chat privado não encontrado:", roomName);
            return;
          }
          const msgDiv = document.createElement("div");
          msgDiv.classList.add("chat-message");
          msgDiv.innerHTML = `<strong>${data.display_name}</strong>: ${data.message}`;
          container.appendChild(msgDiv);
          container.scrollTop = container.scrollHeight;
        }

        // 5) Abrir Chat Privado
        window.openDirectChat = function(targetUserId) {
          if (!myId || !targetUserId) {
            console.warn("IDs inválidos para chat privado:", myId, targetUserId);
            return;
          }
          const minId = Math.min(myId, targetUserId);
          const maxId = Math.max(myId, targetUserId);
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
        
          // createPrivateTab agora retorna uma Promise (ver abaixo)
          createPrivateTab(roomName, targetUserId)
            .then(() => {
              // Agora que a aba (e o container de mensagens) foi criada, podemos trocar para ela
              switchChatTab(roomName);
              // E enviar o convite
              sendPrivateChatInvite(targetUserId, roomName);
            })
            .catch(err => {
              console.error("Erro ao criar a aba de chat privado:", err);
            });
        };
        

        // Função assíncrona que busca os dados do usuário (display_name) utilizando as views "friends" e "all-users"
        async function getUserDisplayName(targetUserId) {
          const API_BASE_URL = "http://127.0.0.1:8000";
          const accessToken = localStorage.getItem("access");

          try {
            // Busca a lista de amigos
            const friendsResponse = await fetch(`${API_BASE_URL}/api/chat/friends/`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const friendsData = await friendsResponse.json();
            // Supondo que a resposta vem em: { friends: [ { user_id, display_name, ... }, ... ] }
            const friendsList = friendsData.friends || [];

            // Busca a lista de todos os usuários (não amigos)
            const allUsersResponse = await fetch(`${API_BASE_URL}/api/chat/all-users/`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const allUsersData = await allUsersResponse.json();
            // Supondo que a resposta vem em: { non_friends: [ { id, display_name, ... }, ... ] }
            const allUsersList = allUsersData.non_friends || [];

            // Tenta encontrar o usuário na lista de amigos (usando a propriedade "user_id")
            let user = friendsList.find(u => parseInt(u.user_id, 10) === parseInt(targetUserId, 10));
            // Se não encontrar, procura na lista de todos os usuários (usando a propriedade "id")
            if (!user) {
              user = allUsersList.find(u => parseInt(u.id, 10) === parseInt(targetUserId, 10));
            }
            return user ? user.display_name : `Usuário ${targetUserId}`;
          } catch (error) {
            console.error("Erro ao buscar o display name:", error);
            return `Usuário ${targetUserId}`;
          }
        }

        // Exemplo de uso na criação da aba de chat privado, de forma assíncrona
        async function createPrivateTab(roomName, targetUserId) {
          if (document.querySelector(`.chat-tab[data-room="${roomName}"]`)) return;

          // Obtém o display_name do usuário via fetch
          const userDisplayName = await getUserDisplayName(targetUserId);

          const chatTabsDiv = document.getElementById("chat-tabs");
          const tab = document.createElement("button");
          tab.classList.add("chat-tab");
          tab.dataset.room = roomName;
          // Usa o nome obtido no rótulo da aba
          tab.innerHTML = `Chat c/ ${userDisplayName} <span class="close-tab" data-room="${roomName}">&times;</span>`;
          if (chatTabsDiv) {
            chatTabsDiv.appendChild(tab);
          }

          const chatWindow = document.querySelector(".chat-window");
          if (!chatWindow) return;
          const privateDiv = document.createElement("div");
          privateDiv.classList.add("chat-messages");
          privateDiv.id = `chat-messages-${roomName}`;
          privateDiv.style.display = "none";
          chatWindow.insertBefore(privateDiv, chatWindow.querySelector(".chat-input"));
        }
        

        function sendPrivateChatInvite(targetUserId, roomName) {
          if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
            const invite = {
              type: "private_chat_invite",
              sender: myId,
              target: targetUserId,
              roomName: roomName,
              message: "Você recebeu um convite para chat privado."
            };
            globalSocket.send(JSON.stringify(invite));
            console.log("Convite de chat privado enviado para:", targetUserId);
          } else {
            console.warn("Global socket não está aberto para enviar convite.");
          }
        }

        console.log("✅ Chat Unificado (Global + Privado) inicializado (com polling).");
      })
      .catch(err => {
        console.error("❌ Erro ao aguardar elementos do chat:", err);
      });
    });
  };

  // ------------------------------------------------------------------
  // 6) Funções de Amizade/Bloqueio (sem alterações desnecessárias)
  // ------------------------------------------------------------------
  const API_BASE_URL = "http://127.0.0.1:8000";
  const accessToken  = localStorage.getItem("access");
  
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
    .then(r => r.json())
    .then(data => {
      alert(data.message || data.error || "Solicitação rejeitada.");
      if (window.fetchPlayers) window.fetchPlayers();
    })
    .catch(err => console.error("Erro ao rejeitar solicitação:", err));
  };
  
  window.inviteToGame = function(targetUserId) {
    alert(`Função de convite não implementada. ID: ${targetUserId}`);
  };
  
  window.viewProfile = function(targetUserId) {
    window.open(`user-profile/${targetUserId}`, "_blank");
  };

})();

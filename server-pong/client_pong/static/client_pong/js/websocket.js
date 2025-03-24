(function() {
  // Dicionário global para armazenar as conexões WebSocket por sala
  window.roomSockets = window.roomSockets || {};
  window.initializeWebSocket = function(roomName) {
    const existingSocket = window.roomSockets[roomName];
    if (existingSocket && existingSocket.readyState === WebSocket.OPEN) {
      console.log(`🔌 [${roomName}] WebSocket já está ativo, retornando socket existente.`);
      return existingSocket;
    }

    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      console.warn("⚠️ Sem token de acesso, não será possível conectar ao WebSocket.");
      return null;
    }

    // Ajuste conforme seu backend
    const WS_BASE_URL = "ws://127.0.0.1:8000/ws/chat";
    const wsUrl = `${WS_BASE_URL}/${roomName}/?access_token=${accessToken}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(`✅ Conectado ao WebSocket da sala: ${roomName}`);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`[${roomName}] Mensagem recebida:`, data);

        // Chama a função "gancho" handleWebSocketMessage se existir
        if (typeof window.handleWebSocketMessage === "function") {
          window.handleWebSocketMessage(roomName, data);
        }
      } catch (err) {
        console.error(`❌ Erro ao parsear mensagem em ${roomName}:`, err);
      }
    };

    socket.onerror = (err) => {
      console.error(`❌ Erro no WebSocket da sala ${roomName}:`, err);
    };

    socket.onclose = () => {
      console.warn(`⚠️ Conexão fechada na sala ${roomName}`);
      // Remove do dicionário se fechar
      if (window.roomSockets[roomName]) {
        delete window.roomSockets[roomName];
      }
    };

    // Armazena o socket recém-criado no dicionário global
    window.roomSockets[roomName] = socket;

    return socket;
  };

  /**
   * Envia uma mensagem de texto para a sala via WebSocket.
   * @param {WebSocket} socket Instância do WebSocket
   * @param {string} roomName Nome da sala
   * @param {string} message Texto a ser enviado
   */
  window.sendMessageToRoom = function(socket, roomName, message) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn(`⚠️ WebSocket da sala '${roomName}' não está aberto.`);
      return;
    }
    const senderId = localStorage.getItem("id") || "0";
    const payload = {
      type: "chat_message",
      room: roomName,
      sender: senderId,
      message: message,
      timestamp: new Date().toISOString(),
    };
    socket.send(JSON.stringify(payload));
  };

  window.handleWebSocketMessage = function(roomName, data) {
    console.log(`handleWebSocketMessage [${roomName}]`, data);
  };
})();

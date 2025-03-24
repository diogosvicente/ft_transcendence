// websocketManager.js
(function(){
    // Configurações e funções auxiliares
    var API_BASE_URL = ""; // Substitua pela sua URL de API
    function getWsUrl(path){
      return path;
    }
  
    // Função de tradução simulada (substitua ou integre com sua lib de i18n)
    function t(key, params){
      if (params) {
        var result = key;
        Object.keys(params).forEach(function(k){
          result = result.replace("{" + k + "}", params[k]);
        });
        return result;
      }
      return key;
    }
  
    // Estado interno
    var notifications = [];
    var tournaments = [];
    var shouldResetChatWindow = false;
    var notificationSocket = null;
    var WS_NOTIFICATION_URL = getWsUrl("/ws/notifications/");
  
    // Recupera detalhes de autenticação do localStorage
    function getAuthDetails(){
      var accessToken = localStorage.getItem("access");
      var loggedID = localStorage.getItem("id");
      return { accessToken: accessToken, loggedID: loggedID };
    }
  
    // Inicializa o WebSocket de notificações
    function initializeNotificationWebSocket(accessToken, userId, context) {
      context = context || "manual";
      if (!accessToken || !userId) {
        console.warn("%cWebSocket de notificações não será inicializado: Token ou ID do usuário ausentes.", "color: orange; font-weight: bold;");
        return;
      }
      if (notificationSocket) {
        console.log("WebSocket de notificações já está conectado.");
        return;
      }
      var wsUrl = WS_NOTIFICATION_URL + "?access_token=" + accessToken + "&user_id=" + userId;
      notificationSocket = new WebSocket(wsUrl);
  
      notificationSocket.onopen = function() {
        console.log("%cConectado ao WebSocket de notificações (" + context + ")", "color: green; font-weight: bold;");
      };
  
      notificationSocket.onmessage = function(event) {
        processWebSocketMessage(event);
      };
  
      notificationSocket.onclose = function() {
        console.warn("%cWebSocket de notificações desconectado. Tentando reconexão...", "color: orange; font-weight: bold;");
        setTimeout(function(){
          initializeNotificationWebSocket(accessToken, userId, "reconnect");
        }, 3000);
      };
  
      notificationSocket.onerror = function(error) {
        console.error("%cErro no WebSocket de notificações:", "color: red;", error);
      };
    }
  
    // Processa as mensagens recebidas via WebSocket
    function processWebSocketMessage(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === "game_challenge") {
          // Exibe um toast interativo para aceitar ou recusar o desafio 1vs1
          showChallengeToast(data.message, data.match_id);
        } else if (data.type === "notification") {
          notifications.push(data);
          showToast("info", data.message);
          if (
            data.message === "Você foi bloqueado." ||
            data.message === "Você bloqueou o usuário." ||
            data.message === "Você recebeu uma solicitação de amizade." ||
            data.message === "Sua solicitação foi aceita." ||
            data.message === "Sua solicitação foi rejeitada." ||
            data.message === "Você foi desbloqueado." ||
            data.message === "Sua amizade foi removida." ||
            data.message === "Você desbloqueou o usuário."
          ) {
            shouldResetChatWindow = true;
            if (window.initChatGlobal)
              window.initChatGlobal();
            if (window.fetchPlayers)
              window.fetchPlayers();
          }
        } else if (data.type === "game_start") {
          var message = (data.state && data.state.message) || data.message;
          var matchId = (data.state && data.state.match_id) || data.match_id;
          showToast("success", message);
          navigateTo("/pong/game/" + matchId);
        } else if (data.type === "game_challenge_declined") {
          showToast("info", data.message);
        } else if (data.type === "tournament") {
          handleNewTournament(data);
        } else if (data.type === "tournament_update") {
          handleTournamentUpdate(data);
        } else {
          console.warn("Tipo de mensagem desconhecido:", data.type);
        }
      } catch (error) {
        console.error("Erro ao processar mensagem WebSocket:", error);
      }
    }
  
    // Funções para tratar desafios e torneios
    function handleAcceptChallenge(matchId) {
      var auth = getAuthDetails();
      fetch(API_BASE_URL + "/api/game/accept-challenge/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + auth.accessToken
        },
        body: JSON.stringify({ match_id: matchId })
      })
      .then(function(response) {
        if (!response.ok) throw new Error("Erro na resposta da rede");
        return response.json();
      })
      .then(function() {
        navigateTo("/pong/game/" + matchId);
      })
      .catch(function(err) {
        console.error("Erro ao aceitar desafio:", err);
        showToast("error", "Erro ao aceitar o desafio.");
      });
    }
  
    function handleDeclineChallenge(matchId) {
      var auth = getAuthDetails();
      fetch(API_BASE_URL + "/api/game/decline-challenge/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + auth.accessToken
        },
        body: JSON.stringify({ match_id: matchId })
      })
      .then(function(response) {
        if (!response.ok) throw new Error("Erro na resposta da rede");
        return response.json();
      })
      .then(function() {
        showToast("info", t("toast.challenge_declined"));
      })
      .catch(function(err) {
        console.error("Erro ao recusar desafio:", err);
        showToast("error", t("toast.challenge_decline_error"));
      });
    }
  
    function handleNewTournament(data) {
      console.log("Torneio recebido via WebSocket:", data.tournament);
      notifications.push(data);
      showToast("success", t("toast.new_tournament") + " " + data.tournament.name);
    }
  
    function handleTournamentUpdate(data) {
      var tournament = data.tournament || {};
      var name = tournament.name || "Desconhecido";
      var totalParticipants = tournament.total_participants || 0;
      var status = tournament.status || "unknown";
  
      if (!tournament.id) {
        console.warn("Mensagem WebSocket ignorada por falta de ID:", data);
        return;
      }
  
      console.log("Atualização de torneio recebida:", tournament);
      notifications.push(data);
  
      if (status === "ongoing") {
        var message = tournament.message
          ? t(tournament.message.key, { name: tournament.message.name })
          : t("toast.tournament_started", { name: name });
        showToast("success", message);
      } else {
        showToast("info", t("toast.tournament_updated", { name: name, totalParticipants: totalParticipants }));
      }
  
      tournaments = tournaments.map(function(item) {
        if (item.id === tournament.id) {
          return Object.assign({}, item, { total_participants: totalParticipants, status: status });
        }
        return item;
      });
    }
  
    // Envia mensagem via WebSocket
    function wsSendNotification(message) {
      if (notificationSocket && notificationSocket.readyState === WebSocket.OPEN) {
        notificationSocket.send(JSON.stringify(message));
      } else {
        console.error("WebSocket de notificações não está conectado.");
      }
    }
  
    // Fecha o WebSocket
    function closeNotificationWebSocket() {
      if (notificationSocket) {
        notificationSocket.close();
        notificationSocket = null;
        console.log("%cWebSocket de notificações fechado.", "color: red; font-weight: bold;");
      }
    }
  
    // Funções de exibição de toasts
    var toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      document.body.appendChild(toastContainer);
    }
  
    function showToast(type, message) {
      console.log("Teste Toast");
      var toastElem = document.createElement("div");
      toastElem.className = "toast " + type;
      toastElem.innerHTML = message;
      toastContainer.appendChild(toastElem);
      setTimeout(function() {
        if (toastElem.parentNode === toastContainer) {
          toastContainer.removeChild(toastElem);
        }
      }, 3000);
    }
  
    function showChallengeToast(sender, matchId) {
      var challengeDiv = document.createElement("div");
      challengeDiv.className = "challenge-toast";
      var msg = document.createElement("p");
      msg.innerHTML = sender;
      challengeDiv.appendChild(msg);
  
      var acceptButton = document.createElement("button");
      acceptButton.innerHTML = "Aceitar";
      acceptButton.addEventListener("click", function() {
        handleAcceptChallenge(matchId);
        if (toastContainer.contains(challengeDiv)) {
          toastContainer.removeChild(challengeDiv);
        }
      });
      challengeDiv.appendChild(acceptButton);
  
      var declineButton = document.createElement("button");
      declineButton.innerHTML = "Recusar";
      declineButton.addEventListener("click", function() {
        handleDeclineChallenge(matchId);
        if (toastContainer.contains(challengeDiv)) {
          toastContainer.removeChild(challengeDiv);
        }
      });
      challengeDiv.appendChild(declineButton);
  
      toastContainer.appendChild(challengeDiv);
  
      setTimeout(function() {
        if (toastContainer.contains(challengeDiv)) {
          toastContainer.removeChild(challengeDiv);
        }
      }, 10000);
    }
  
    // Função simples de navegação para o SPA
    function navigateTo(url) {
      window.location.href = url;
    }
  
    // Expondo a “API” globalmente
    window.WebSocketManager = {
      notifications: notifications,
      tournaments: tournaments,
      shouldResetChatWindow: shouldResetChatWindow,
      initializeNotificationWebSocket: initializeNotificationWebSocket,
      closeNotificationWebSocket: closeNotificationWebSocket,
      wsSendNotification: wsSendNotification,
      setShouldResetChatWindow: function(value){ shouldResetChatWindow = value; }
    };
  
    // Inicializa automaticamente o WebSocket ao carregar a página
    document.addEventListener("DOMContentLoaded", function(){
      var auth = getAuthDetails();
      if (auth.accessToken && auth.loggedID) {
        initializeNotificationWebSocket(auth.accessToken, auth.loggedID, "auto");
      }
    });
  
    // Fecha o WebSocket ao sair da página
    window.addEventListener("beforeunload", function(){
      closeNotificationWebSocket();
    });
  })();
  
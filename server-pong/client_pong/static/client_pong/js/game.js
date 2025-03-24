(() => {
  console.log("Hello from game.js");
  const API_BASE_URL = "/api";
  const defaultAvatar = "/static/client_pong/avatars/default.png";

  const elements = {
    loading: document.getElementById("game-loading"),
    error: document.getElementById("game-error"),
    content: document.getElementById("game-content"),
    player1Avatar: document.getElementById("player1-avatar"),
    player1Name: document.getElementById("player1-name"),
    player1You: document.getElementById("player1-you"),
    player2Avatar: document.getElementById("player2-avatar"),
    player2Name: document.getElementById("player2-name"),
    player2You: document.getElementById("player2-you"),
    pauseButton: document.getElementById("pause-button"),
    gameOverMessage: document.getElementById("game-over-message"),
  };

  console.log(elements);

  let pongInstance = null;
  let isPaused = false;

  const showError = (message) => {
    elements.error.textContent = message;
    elements.error.classList.remove("d-none");
    elements.content.classList.add("d-none");
    elements.loading.classList.add("d-none");
  };

  const fetchMatchData = async (matchId) => {
    console.log("fetchMatchData");
    try {
      const accessToken = localStorage.getItem("access");
      const response = await fetch(`${API_BASE_URL}/game/match/${matchId}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log(response);
      if (!response.ok) throw new Error("Failed to fetch match data");
      return await response.json();
    } catch (error) {
      console.error(error.message);
      showError(error.message || "Error loading match data");
      return null;
    }
  };

  const renderPlayersInfo = (matchData, isPlayer1) => {
    console.log("matchData:", matchData);

    // Player 1
    if (elements.player1Avatar) {
      if (matchData.player1_avatar) {
        elements.player1Avatar.src = `${API_BASE_URL}${matchData.player1_avatar}`;
      } else {
        elements.player1Avatar.src = defaultAvatar;
      }
    }
    elements.player1Name.textContent =
      matchData.player1_display || "Unknown Player";
    if (isPlayer1) elements.player1You.classList.remove("d-none");

    if (elements.player2Avatar) {
      if (matchData.player2_avatar) {
        elements.player2Avatar.src = `${API_BASE_URL}${matchData.player2_avatar}`;
      } else {
        elements.player2Avatar.src = defaultAvatar;
      }
    }
    }
    elements.player2Name.textContent =
      matchData.player2_display || "Unknown Player";
    if (!isPlayer1) elements.player2You.classList.remove("d-none");
  });

  const togglePause = () => {
    if (!pongInstance) return;
    isPaused = !isPaused;
    pongInstance.gameState.paused = isPaused;
    elements.pauseButton.textContent = isPaused ? "Resume" : "Pause";
  };

  const initGameRoom = async () => {
    console.log("initGameRoom");

    // Extract matchId from the URL path
    const path = window.location.pathname;
    const matchId = path.split("/").pop(); // Get the last part of the URL
    console.log("Extracted matchId:", matchId);

    if (!matchId) {
      showError("Match ID not found in the URL.");
      return;
    }

    const matchData = await fetchMatchData(matchId);
    if (!matchData) {
      console.log("matchData is null");
      return;
    }

    console.log(matchData);

    const loggedUserId = parseInt(localStorage.getItem("id"), 10);
    const isPlayer1 = matchData.player1_id === loggedUserId;

    // Render players info
    renderPlayersInfo(matchData, isPlayer1);

    // Initialize PongGame
    elements.loading.classList.add("d-none");
    elements.content.classList.remove("d-none");

    pongInstance = new PongGame("pongCanvas");

    // Pause button functionality
    elements.pauseButton.addEventListener("click", togglePause);
  };

  document.addEventListener("DOMContentLoaded", initGameRoom);
})();

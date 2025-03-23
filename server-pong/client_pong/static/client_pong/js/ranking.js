window.initRanking = async () => {
  // DOM Elements
  const elements = {
    loading: document.getElementById("ranking-loading"),
    error: document.getElementById("ranking-error"),
    content: document.getElementById("ranking-content"),
  };

  // State
  let state = {
    tournamentRanking: [],
    victoriesRanking: [],
    error: null,
  };

  // Helpers
  const showError = (message) => {
    elements.error.textContent = message;
    elements.error.classList.remove("d-none");
    elements.content.classList.add("d-none");
    elements.loading.classList.add("d-none");
  };

  const renderRankingTable = (container, ranking, title, type) => {
    const section = document.createElement("div");
    section.className = `ranking-section ${type}`;

    const heading = document.createElement("h2");
    heading.className = "ranking-title";
    heading.textContent = title;
    section.appendChild(heading);

    if (ranking.length > 0) {
      const table = document.createElement("table");
      table.className = "table table-striped table-bordered";

      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr>
          <th>#</th>
          <th>Avatar</th>
          <th>Name</th>
          <th>${type === "tournament" ? "Tournaments Won" : "Wins"}</th>
          ${type !== "tournament" ? "<th>Losses</th>" : ""}
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      ranking.forEach((user, index) => {
        const row = document.createElement("tr");

        // Rank Number
        const rankCell = document.createElement("td");
        rankCell.textContent =
          index + 1 === 1
            ? "🏆"
            : index + 1 === 2
            ? "🥈"
            : index + 1 === 3
            ? "🥉"
            : index + 1;
        row.appendChild(rankCell);

        // Avatar
        const avatarCell = document.createElement("td");
        const avatar = document.createElement("img");
        avatar.src = user.avatar
          ? `${API_BASE_URL}${user.avatar}`
          : `${API_BASE_URL}/media/avatars/default.png`;
        avatar.alt = user.display_name;
        avatar.className = "img-thumbnail avatar-sm"; // Bootstrap class for small avatar
        avatar.style.width = "50px"; // Ensure small size
        avatar.style.height = "50px";
        avatarCell.appendChild(avatar);
        row.appendChild(avatarCell);

        // Name
        const nameCell = document.createElement("td");
        nameCell.textContent = user.display_name;
        row.appendChild(nameCell);

        // Stats
        const statsCell = document.createElement("td");
        statsCell.textContent =
          type === "tournament" ? user.tournaments_won : user.wins;
        row.appendChild(statsCell);

        if (type !== "tournament") {
          const lossesCell = document.createElement("td");
          lossesCell.textContent = user.losses;
          row.appendChild(lossesCell);
        }

        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      section.appendChild(table);
    } else {
      const noData = document.createElement("p");
      noData.className = "no-data";
      noData.textContent = "No data available";
      section.appendChild(noData);
    }

    container.appendChild(section);
  };

  // Fetch Rankings
  try {
    const accessToken = localStorage.getItem("access");

    // Fetch tournament ranking
    const tournamentRes = await fetch("/api/game/ranking/tournaments/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!tournamentRes.ok)
      throw new Error("Failed to fetch tournament ranking");
    const tournamentRanking = await tournamentRes.json();

    // Fetch victories ranking
    const victoriesRes = await fetch(
      "/api/user-management/ranking/victories/",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!victoriesRes.ok) throw new Error("Failed to fetch victories ranking");
    const victoriesRanking = await victoriesRes.json();

    // Update state
    state = { ...state, tournamentRanking, victoriesRanking };

    // Update UI
    elements.loading.classList.add("d-none");
    elements.content.classList.remove("d-none");

    // Render rankings
    renderRankingTable(
      elements.content,
      state.tournamentRanking,
      "Most Tournaments Won",
      "tournament"
    );
    renderRankingTable(
      elements.content,
      state.victoriesRanking,
      "Most Victories",
      "victories"
    );
  } catch (err) {
    console.error("Error loading rankings:", err);
    showError(err.message || "Error loading rankings");
  }
};

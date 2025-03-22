function initHome() {
    const userId = localStorage.getItem("id");
    const accessToken = localStorage.getItem("access");
  
    let displayName = localStorage.getItem("displayName") || "Jogador";
  
    if (userId && accessToken) {
      fetch(`${API_BASE_URL}/api/user-management/user-info/${userId}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.ok ? res.json() : Promise.reject("Erro ao buscar display_name"))
        .then((data) => {
          displayName = data.display_name || "Jogador";
          localStorage.setItem("displayName", displayName);
          renderHomeContent(displayName);
        })
        .catch((err) => {
          console.warn(err);
          renderHomeContent(displayName);
        });
    } else {
      renderHomeContent(displayName);
    }
  }
  
  function renderHomeContent(displayName) {
    const container = document.querySelector("#root .container") || document.getElementById("root");
  
    const welcomeMsg = window.i18n && window.i18n.t
      ? window.i18n.t("homepage.welcome_message")
      : "Bem-vindo";
  
    container.innerHTML = `
      <div class="mt-5 text-center">
        <h1 class="h1-greeting">
          ${welcomeMsg}, <span class="highlighted-name">${displayName}</span>!
        </h1>
  
        <h2 class="h2-title">FT_TRANSCENDENCE</h2>
        <hr>
  
        <div class="pong-ball"></div>
      </div>
    `;
  }
  
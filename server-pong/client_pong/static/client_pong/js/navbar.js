// navbar.js

// Função para tratar o logout do usuário
function handleLogout() {
  const accessToken = localStorage.getItem("access");
  const refreshToken = localStorage.getItem("refresh");

  if (refreshToken) {
    fetch(`${API_BASE_URL}/api/user-management/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })
      .then((response) => {
        if (response.ok) {
          console.log("Logout realizado com sucesso.");
        } else {
          return response.json().then((err) => {
            console.error("Erro ao realizar logout:", err);
          });
        }
      })
      .catch((error) => {
        console.error("Erro na requisição de logout:", error);
      })
      .finally(() => {
        // Limpa dados do usuário e redireciona para a home
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("id");
        window.location.href = "/pong";
      });
  }
}

// Variável para evitar re-inicializar a navbar
let navbarInitialized = false;

// Função para inicializar a navbar
function initNavbar() {
  // Se já inicializamos a navbar antes, não faça novamente
  if (navbarInitialized) return;
  navbarInitialized = true;

  // Seleciona os elementos do DOM
  const navbarAvatar = document.getElementById("navbarAvatar");
  const navbarProfileLink = document.getElementById("navbarProfileLink");
  const userGreeting = document.querySelector(".user-greeting");
  const logoutButton = document.getElementById("btnLogout");

  // Define o avatar padrão
  const defaultAvatar = `${API_BASE_URL}/media/avatars/default.png`;

  // Obtém os dados do usuário do localStorage
  const userId = localStorage.getItem("id");
  const accessToken = localStorage.getItem("access");

  // Se o usuário estiver logado, busca as informações dele no backend
  if (userId && accessToken) {
    fetch(`${API_BASE_URL}/api/user-management/user-info/${userId}/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao buscar informações do usuário");
        }
        return response.json();
      })
      .then((data) => {
        // Monta a URL do avatar ou usa o padrão
        const fullAvatarUrl = data.avatar
          ? `${API_BASE_URL}${data.avatar}`
          : defaultAvatar;
        if (navbarAvatar) {
          navbarAvatar.src = fullAvatarUrl;
        }
        if (userGreeting) {
          userGreeting.textContent = `Olá, ${data.display_name || ""}`;
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar usuário:", error);
        if (navbarAvatar) {
          navbarAvatar.src = defaultAvatar;
        }
        if (userGreeting) {
          userGreeting.textContent = "Olá, ";
        }
      });
  } else {
    // Se não estiver logado, define os valores padrões
    if (navbarAvatar) {
      navbarAvatar.src = defaultAvatar;
    }
    if (userGreeting) {
      userGreeting.textContent = "Olá, ";
    }
  }

  // Define o link para o perfil do usuário
  if (navbarProfileLink) {
    navbarProfileLink.href = `/pong/user-profile/${userId || "0"}`;
  }

  // Atribui o evento de logout ao botão
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
  }
}

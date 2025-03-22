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

// Função para alterar o idioma e atualizar o backend via PUT
function handleLanguageChange(language) {
  // Evita trocas repetidas se o idioma já for o mesmo
  if (window.i18n && window.i18n.language === language) {
    console.log(`Idioma já é '${language}', ignorando...`);
    return;
  }

  console.log("Mudando idioma para:", language);

  const userId = localStorage.getItem("id");
  const accessToken = localStorage.getItem("access");

  if (userId && accessToken) {
    fetch(`${API_BASE_URL}/api/user-management/user/${userId}/language/`, {
      method: "PUT", // Utiliza PUT conforme a view do Django
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ language }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao atualizar idioma no backend.");
        }
        return response.json();
      })
      .then((data) => {
        const userLang = data.current_language;
        if (userLang && window.i18n && window.i18n.changeLanguage) {
          window.i18n.changeLanguage(userLang).then(() => {
            updateNavbarTranslations();  // <-- Atualiza a navbar aqui!
          });
        } else if (window.i18n && window.i18n.changeLanguage) {
          window.i18n.changeLanguage(language).then(() => {
            updateNavbarTranslations();  // <-- Atualiza a navbar aqui também!
          });
        }
      })
      .catch((error) => {
        console.error("Erro ao atualizar idioma do usuário:", error);
      });
  } else {
    // Se não estiver logado, muda apenas localmente
    if (window.i18n && window.i18n.changeLanguage) {
      window.i18n.changeLanguage(language);
    }
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
    // 1. Busca informações básicas do usuário (avatar e display name)
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
        // Se houver avatar, monta a URL completa; caso contrário, usa o padrão
        const fullAvatarUrl = data.avatar
          ? `${API_BASE_URL}${data.avatar}`
          : defaultAvatar;
        if (navbarAvatar) {
          navbarAvatar.src = fullAvatarUrl;
        }
        if (userGreeting) {
          // Se i18n estiver disponível, usa a tradução para a saudação; senão, usa "Olá"
          const greetingText =
            window.i18n && window.i18n.t
              ? window.i18n.t("navbar.greeting")
              : "Olá";
          userGreeting.textContent = `${greetingText}, ${data.display_name || ""}`;
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar usuário:", error);
        if (navbarAvatar) {
          navbarAvatar.src = defaultAvatar;
        }
        if (userGreeting) {
          const greetingText =
            window.i18n && window.i18n.t ? window.i18n.t("navbar.greeting") : "Olá";
          userGreeting.textContent = `${greetingText}, `;
        }
      });

    // 2. Busca o idioma do usuário no backend e atualiza o i18next se necessário
    fetch(`${API_BASE_URL}/api/user-management/user/${userId}/language/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao buscar idioma do usuário");
        }
        return response.json();
      })
      .then((data) => {
        const userLang = data.current_language;
        if (
          userLang &&
          window.i18n &&
          window.i18n.changeLanguage &&
          userLang !== window.i18n.language
        ) {
          window.i18n.changeLanguage(userLang);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar idioma do usuário:", error);
      });
  } else {
    // Se não estiver logado, define os valores padrões
    if (navbarAvatar) {
      navbarAvatar.src = defaultAvatar;
    }
    if (userGreeting) {
      const greetingText =
        window.i18n && window.i18n.t ? window.i18n.t("navbar.greeting") : "Olá";
      userGreeting.textContent = `${greetingText}, `;
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

  // Configura os eventos de clique para os cards de idioma.
  // Assumindo que os elementos de idioma possuem a classe "language-card" e um atributo data-lang.
  const languageCards = document.querySelectorAll(".language-card");
  languageCards.forEach((card) => {
    card.addEventListener("click", function () {
      const lang = card.getAttribute("data-lang");
      handleLanguageChange(lang);
    });
  });

  if (window.i18n) {
    window.i18n.on('initialized', updateNavbarTranslations);
    window.i18n.on('languageChanged', updateNavbarTranslations);
  }

  if (window.i18n) {
    window.i18n.on('initialized', () => {
      updateNavbarTranslations();
      updateStaticTranslations();
    });
    window.i18n.on('languageChanged', () => {
      updateNavbarTranslations();
      updateStaticTranslations();
    });
  }
}

function updateNavbarTranslations() {
  const userGreeting = document.querySelector(".user-greeting");
  const displayName = localStorage.getItem("displayName") || "";
  if (userGreeting && window.i18n && window.i18n.t) {
    const greetingText = window.i18n.t("navbar.greeting");
    userGreeting.textContent = `${greetingText}, ${displayName}`;
  }
}

function updateStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(element => {
    const translationKey = element.getAttribute("data-i18n");
    if (translationKey && window.i18n && window.i18n.t) {
      element.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) node.nodeValue = '';
      });
      element.prepend(window.i18n.t(translationKey));
    }
  });

}
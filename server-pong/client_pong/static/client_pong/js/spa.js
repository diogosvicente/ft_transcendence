/**************************************************************
 * spa.js
 * Exemplo de SPA com rotas públicas/privadas e layout de navbar
 * Carregando arquivos HTML externos (partials) E o landing.js
 * quando a rota "/pong/" é acessada.
 **************************************************************/

/* ========== 1. Checagem de Autenticação ========== */
function isAuthenticated() {
  // Se existir "access" no localStorage, consideramos logado
  return !!localStorage.getItem("access");
}

/* ========== 2. Navbar (HTML) ========== */
function renderNavbar(userData) {
  // userData pode conter avatar, displayName, etc.
  // Ajuste conforme sua API real
  const avatarUrl = userData?.avatar || "/media/avatars/default.png";
  const displayName = userData?.displayName || "Usuário";

  return `
    <nav class="navbar navbar-light bg-light mb-4">
      <div class="container-fluid">
        <a href="/pong/" data-link class="navbar-brand">
          <img src="${avatarUrl}" alt="Avatar" 
               style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
          <span class="ms-2">Pong App</span>
        </a>
        <div>
          <a href="/pong/chat" data-link class="me-3">Chat</a>
          <a href="/pong/tournaments" data-link class="me-3">Torneios</a>
          <a href="/pong/user-profile/${localStorage.getItem("id")}" data-link class="me-3">Perfil</a>
          <a href="/pong/ranking" data-link class="me-3">Ranking</a>

          <!-- Seletor de idioma -->
          <span class="me-3">
            <img src="/static/client_pong/images/brazil-flag-round-circle-icon.svg" 
                 alt="PT" style="width:24px; cursor:pointer;" data-lang="pt_BR">
            <img src="/static/client_pong/images/uk-flag-round-circle-icon.svg" 
                 alt="EN" style="width:24px; cursor:pointer;" data-lang="en">
            <img src="/static/client_pong/images/spain-flag-round-icon.svg" 
                 alt="ES" style="width:24px; cursor:pointer;" data-lang="es">
          </span>

          <button class="btn btn-outline-secondary" id="btnLogout">Sair</button>
        </div>
      </div>
    </nav>
  `;
}

/* ========== 3. Layout Público vs. Privado ========== */

// Layout público: não tem navbar
function renderPublicLayout(contentHTML) {
  return `
    <div>${contentHTML}</div>
  `;
}

// Layout privado: tem navbar no topo + conteúdo
async function renderPrivateLayout(contentHTML) {
  let userData = null;
  try {
    const userId = localStorage.getItem("id");
    const accessToken = localStorage.getItem("access");
    if (userId && accessToken) {
      const resp = await fetch(`/api/user-management/user-info/${userId}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        userData = {
          avatar: data.avatar ? data.avatar : "/media/avatars/default.png",
          displayName: data.display_name,
        };
      }
    }
  } catch (err) {
    console.error("Erro ao buscar user data:", err);
  }

  const navbarHTML = renderNavbar(userData);
  return `
    ${navbarHTML}
    <div class="container">${contentHTML}</div>
  `;
}

/* ========== 4. Carregar parciais HTML ========== */
async function loadPartial(partialFile) {
  const url = `/static/client_pong/pages/${partialFile}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Não foi possível carregar a parcial: ${partialFile}`);
  }
  return await response.text();
}

/* ========== 4.1 Carregar script dinamicamente ========== */
function loadScript(scriptName) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `/static/client_pong/js/${scriptName}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha ao carregar script ${scriptName}`));
    document.body.appendChild(script);
  });
}

/* ========== 5. Definição de Rotas ========== */
const routes = [
  {
    path: "^/pong/$",
    partial: "landing.html",
    private: false,
    layout: "public",
  },
  {
    path: "^/pong/home$",
    partial: "home.html",
    private: false,
    layout: "private",
  },
  {
    path: "^/pong/chat$",
    partial: "chat.html",
    private: true,
    layout: "private",
  },
  {
    path: "^/pong/tournaments$",
    partial: "tournaments.html",
    private: true,
    layout: "private",
  },
  {
    path: "^/pong/profile$",
    partial: "profile.html",
    private: true,
    layout: "private",
  },
  {
    path: "^/pong/ranking$",
    partial: "ranking.html",
    private: true,
    layout: "private",
  },
  {
    path: "^/pong/user-profile/(?<user_id>\\w+)$",
    partial: "user_profile.html",
    private: true,
    layout: "private",
  },
  {
    path: "^/pong/local-match$",
    partial: "local_match.html",
    private: false,
    layout: "public",
  },
  {
    path: "^/pong/game/(?<matchId>\\w+)$",
    partial: "game.html",
    private: true,
    layout: "private",
  },
];

/* ========== 6. Roteador (History API) ========== */
async function handleRoute() {
  const path = window.location.pathname;

  for (let route of routes) {
    const regex = new RegExp(route.path);
    const match = path.match(regex);
    if (match) {
      // Se for rota privada mas não estiver autenticado => redireciona
      if (route.private && !isAuthenticated()) {
        navigateTo("/pong/");
        return;
      }

      let partialHTML = "";
      try {
        partialHTML = await loadPartial(route.partial);
      } catch (err) {
        console.error(err);
        document.getElementById("root").innerHTML = `<h1>Erro ao carregar a página</h1>`;
        return;
      }

      let finalHTML = "";
      if (route.layout === "public") {
        finalHTML = renderPublicLayout(partialHTML);
      } else {
        finalHTML = await renderPrivateLayout(partialHTML);
      }

      document.getElementById("root").innerHTML = finalHTML;

      attachEventsAfterRender(route, match.groups || {});
      return;
    }
  }

  // Se nenhuma rota casar => 404
  document.getElementById("root").innerHTML = "<h1>404 - Página não encontrada</h1>";
}

function navigateTo(url) {
  history.pushState({}, "", url);
  handleRoute();
}

// Intercepta cliques em <a data-link>
document.addEventListener("click", (e) => {
  const link = e.target.closest("a[data-link]");
  if (link) {
    e.preventDefault();
    navigateTo(link.getAttribute("href"));
  }
});

// Botão Voltar/Avançar do navegador
window.addEventListener("popstate", handleRoute);

/* ========== 7. Eventos pós-render (dynamic script loading) ========== */
async function attachEventsAfterRender(route, params) {
  // Se a rota for /pong/ (Landing), carregamos o landing.js
  if (route.path === "^/pong/$") {
    try {
      await loadScript("landing.js"); 
      // Supondo que landing.js define window.initLanding()
      if (window.initLanding) {
        window.initLanding();
      } else {
        console.error("initLanding não foi definido em landing.js");
      }
    } catch (err) {
      console.error("Erro ao carregar landing.js:", err);
    }
  }

  // Exemplo de logout no layout privado
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        const access = localStorage.getItem("access");
        const refresh = localStorage.getItem("refresh");
        if (refresh) {
          await fetch(`/api/user-management/logout/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access}`
            },
            body: JSON.stringify({ refresh }),
          });
        }
      } catch (err) {
        console.error("Erro ao deslogar:", err);
      } finally {
        // Limpa localStorage
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("id");
        // Volta para landing
        navigateTo("/pong/");
      }
    });
  }

  // Seletor de idioma
  document.querySelectorAll("[data-lang]").forEach((langEl) => {
    langEl.addEventListener("click", () => {
      const lang = langEl.getAttribute("data-lang");
      console.log("Mudando idioma para:", lang);
      // Aqui você implementaria a lógica real de i18n
    });
  });
}

/* ========== 8. Início da aplicação ========== */
document.addEventListener("DOMContentLoaded", () => {
  handleRoute();
});

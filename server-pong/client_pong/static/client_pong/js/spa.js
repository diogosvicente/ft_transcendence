/**************************************************************
 * spa.js
 * Exemplo de SPA com rotas públicas/privadas, layout via navbar.html
 * e carregamento dinâmico de scripts (landing.js, home.js, etc.).
 **************************************************************/

/* ========== 1. Checagem de Autenticação ========== */
function isAuthenticated() {
  return !!localStorage.getItem("access");
}

/* ========== 2. Carregar partial HTML (ex.: landing.html, home.html) ========== */
async function loadPartial(partialFile) {
  const url = `/static/client_pong/pages/${partialFile}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Não foi possível carregar a parcial: ${partialFile}`);
  }
  return await resp.text();
}

/* ========== 3. Carregar script dinamicamente (ex.: landing.js, navbar.js) ========== */
function loadScript(scriptName) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `/static/client_pong/js/${scriptName}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha ao carregar script: ${scriptName}`));
    document.body.appendChild(script);
  });
}

/* ========== 4. Carregar e injetar a navbar (para layout privado) ========== */
async function loadNavbarHTML() {
  const url = "/static/client_pong/pages/navbar.html";
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error("Não foi possível carregar navbar.html");
  }
  return await resp.text();
}

/* ========== 5. Layout Público vs. Privado ========== */

/** 
 * Layout público: não tem navbar
 */
function renderPublicLayout(contentHTML) {
  return `
    <div>${contentHTML}</div>
  `;
}

/** 
 * Layout privado: carrega navbar.html e concatena com o conteúdo
 * Também pode buscar dados do usuário, se necessário.
 */
async function renderPrivateLayout(contentHTML, route) {
  // 1) Buscar dados do usuário (opcional)
  try {
    const userId = localStorage.getItem("id");
    const accessToken = localStorage.getItem("access");
    if (userId && accessToken) {
      const resp = await fetch(`/api/user-management/user-info/${userId}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        // Armazena avatar e displayName no localStorage, se quiser
        localStorage.setItem("avatarUrl", data.avatar ? `/${data.avatar}` : "/static/client_pong/avatars/default.png");
        localStorage.setItem("displayName", data.display_name || "");
      }
    }
  } catch (err) {
    console.error("Erro ao buscar user data:", err);
  }

  // 2) Carrega a navbar.html
  let navbarHTML = "";
  try {
    navbarHTML = await loadNavbarHTML();
  } catch (err) {
    console.error("Erro ao carregar navbar.html:", err);
  }

  // 3) Retorna navbar + conteúdo final
  return `
    ${navbarHTML}
    <div class="container">${contentHTML}</div>
  `;
}

/* ========== 6. Definição de Rotas ========== */
/**
 * Cada rota define:
 * - path: regex para window.location.pathname
 * - partial: nome do arquivo HTML
 * - script: nome do arquivo JS (se quiser dinamicamente)
 * - initFunction: nome da função global (ex.: window.initLanding)
 * - private: se rota exige login
 * - layout: "public" ou "private"
 */
const routes = [
  {
    path: "^/pong/$",
    partial: "landing.html",
    script: "landing.js",
    initFunction: "initLanding",
    private: false,
    layout: "public",
  },
  {
    path: "^/pong/home$",
    partial: "home.html",
    script: "home.js",
    initFunction: "initHome",
    private: false,
    layout: "private",
  },
  {
    path: "^/pong/chat$",
    partial: "chat.html",
    script: "chat.js",
    initFunction: "initChat",
    private: true,
    layout: "private",
  },
  {
    path: "^/pong/tournaments$",
    partial: "tournaments.html",
    script: "tournaments.js",
    initFunction: "initTournaments",
    private: true,
    layout: "private",
  },
  {
    path: "^/pong/profile$",
    partial: "profile.html",
    script: "profile.js",
    initFunction: "initProfile",
    private: true,
    layout: "private",
  },
  {
    path: "^/pong/ranking$",
    partial: "ranking.html",
    script: "ranking.js",
    initFunction: "initRanking",
    private: true,
    layout: "private",
  },
  {
    path: "^/pong/user-profile/(?<user_id>\\w+)$",
    partial: "user-profile.html",
    script: "user-profile.js",
    initFunction: "initUserProfile",
    private: true,
    layout: "private",
  },
  {
    path: "^/pong/local-match$",
    partial: "local_match.html",
    script: "local_match.js",
    initFunction: "initLocalMatch",
    private: false,
    layout: "public",
  },
  {
    path: "^/pong/game/(?<matchId>\\w+)$",
    partial: "game.html",
    script: "game.js",
    initFunction: "initGame",
    private: true,
    layout: "private",
  },
];

/* ========== 7. Roteador (History API) ========== */
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

      // Carrega o HTML parcial
      let partialHTML = "";
      try {
        partialHTML = await loadPartial(route.partial);
      } catch (err) {
        console.error(err);
        document.getElementById("root").innerHTML = `<h1>Erro ao carregar a página</h1>`;
        return;
      }

      // Monta layout público ou privado
      let finalHTML = "";
      if (route.layout === "public") {
        finalHTML = renderPublicLayout(partialHTML);
      } else {
        // Layout privado
        finalHTML = await renderPrivateLayout(partialHTML, route);
      }

      // Insere no #root
      document.getElementById("root").innerHTML = finalHTML;

      // attachEventsAfterRender + script dinâmico
      attachEventsAfterRender(route, match.groups || {});
      return;
    }
  }

  // Se nenhuma rota casar => 404
  document.getElementById("root").innerHTML = "<h1>404 - Página não encontrada</h1>";
}

/** Atualiza URL e chama handleRoute() */
function navigateTo(url) {
  history.pushState({}, "", url);
  handleRoute();
}

// Intercepta cliques em <a data-link> para evitar reload e usar SPA
document.addEventListener("click", (e) => {
  const link = e.target.closest("a[data-link]");
  if (link) {
    e.preventDefault();
    navigateTo(link.getAttribute("href"));
  }
});

// Botão Voltar/Avançar do navegador
window.addEventListener("popstate", handleRoute);

/* ========== 8. Eventos pós-render ========== */
async function attachEventsAfterRender(route, params) {
  // 8.1. Carregar script dinâmico da rota, se definido
  if (route.script) {
    try {
      await loadScript(route.script);
      if (route.initFunction && window[route.initFunction]) {
        window[route.initFunction]();
      } else {
        console.warn(`Função de init não definida: ${route.initFunction}`);
      }
    } catch (err) {
      console.error(`Erro ao carregar script ${route.script}:`, err);
    }
  }

  // 8.2. Carregar script da navbar (caso a rota seja privada)
  if (route.layout === "private") {
    try {
      await loadScript("navbar.js"); // Carrega o script da navbar
      if (window.initNavbar) {
        window.initNavbar(); // Inicializa a navbar (avatar, logout, idioma)
      }
    } catch (err) {
      console.error("Erro ao carregar navbar.js:", err);
    }
  }

  // 8.3. Seletor de idioma (já coberto em navbar.js, mas se quiser adicional)
  document.querySelectorAll("[data-lang]").forEach((langEl) => {
    langEl.addEventListener("click", () => {
      const lang = langEl.getAttribute("data-lang");
      console.log("Mudando idioma para:", lang);
      // Lógica real de i18n se quiser
    });
  });
}

/* ========== 9. Início da aplicação ========== */
document.addEventListener("DOMContentLoaded", () => {
  handleRoute();
});

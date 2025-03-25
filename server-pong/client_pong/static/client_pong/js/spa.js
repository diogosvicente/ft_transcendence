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
    script.onerror = () =>
      reject(new Error(`Falha ao carregar script: ${scriptName}`));
    document.body.appendChild(script);
  });
}

/* ========== 4. Carregar e injetar a navbar (para layout privado) ========== */
// Função para carregar o HTML da navbar
async function loadNavbarHTML() {
  const url = "/static/client_pong/pages/navbar.html";
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error("Não foi possível carregar navbar.html");
  }
  return await resp.text();
}

// Função para carregar o CSS da navbar
async function loadNavbarCSS() {
  const url = "/static/client_pong/css/navbar.css";
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error("Não foi possível carregar navbar.css");
  }
  return await resp.text();
}

// Variável para evitar recarregar a navbar mais de uma vez
let navbarLoaded = false;

// Função que carrega (se ainda não carregada) e injeta a navbar em um contêiner fixo
async function initNavbar() {
  if (!navbarLoaded) {
    try {
      const [navbarHTML, navbarCSS] = await Promise.all([
        loadNavbarHTML(),
        loadNavbarCSS()
      ]);
      // Injetar o CSS da navbar (apenas uma vez)
      const styleEl = document.createElement("style");
      styleEl.textContent = navbarCSS;
      document.head.appendChild(styleEl);
      // Injetar o HTML da navbar no contêiner fixo (definido no template, ex.: <div id="navbar-container"></div>)
      document.getElementById("navbar-container").innerHTML = navbarHTML;
      navbarLoaded = true;
      // Opcional: carrega os scripts e inicializa os eventos da navbar
      await loadScript("navbar.js");
      if (window.initNavbar) {
        window.initNavbar();
      }
    } catch (error) {
      console.error("Erro ao carregar a navbar:", error);
    }
  }
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
 * Layout privado: utiliza a navbar fixa injetada no contêiner #navbar-container
 * e renderiza o conteúdo dinâmico no elemento #root.
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
        // Armazena avatar e displayName no localStorage, se desejar
        localStorage.setItem(
          "avatarUrl",
          data.avatar
            ? `${API_BASE_URL}${data.avatar}`
            : `${API_BASE_URL}/media/avatars/default.png`
        );
        localStorage.setItem("displayName", data.display_name || "");
      }
    }
  } catch (err) {
    console.error("Erro ao buscar user data:", err);
  }

  // 2) Garante que a navbar esteja carregada no contêiner fixo
  await initNavbar();

  // 3) Retorna somente o conteúdo dinâmico (a navbar permanece fixa)
  return `<div class="container">${contentHTML}</div>`;
}

/* ========== 6. Definição de Rotas ========== */
/**
 * Cada rota define:
 * - path: regex para window.location.pathname
 * - partial: nome do arquivo HTML
 * - script: nome do arquivo JS (se quiser carregá-lo dinamicamente)
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
    private: true,
    layout: "private",
  },
  {
    path: "^/pong/chat$",
    partial: "chat.html",
    script: "chat.js",
    initFunction: "initChatGlobal",
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
    path: "^/pong/user-profile/(?<user_id>\\d+)$",  // Altere para \\d+ se user_id for numérico
    partial: "user-profile.html",
    script: "user-profile.js",
    initFunction: "initUserProfile",
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
    partial: "local-match.html",
    script: "local-match.js",
    initFunction: "initLocalMatch",
    cleanupFunction: "cleanupLocalMatch",
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

      // Exemplo para a rota /pong/home
      if (route.path === "^/pong/home$") {
        try {
          await loadScript("home.js");
          // Se quiser, chamar algo como window.initHome();
        } catch (err) {
          console.error("Erro ao carregar home.js:", err);
        }
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
        // Layout privado: o conteúdo dinâmico é renderizado em #root, enquanto a navbar permanece fixa
        finalHTML = await renderPrivateLayout(partialHTML, route);
      }

      // Insere o conteúdo final no #root
      document.getElementById("root").innerHTML = finalHTML;

      // Para /pong/chat (rota do chat)
      if (route.path === "^/pong/chat$") {
        // Carrega scripts na ordem correta
        try {
          await loadScript("websocket.js");
          await loadScript("playerList.js");

          if (window.initPlayerList)
            window.initPlayerList();  
        } catch (err) {
          console.error("❌ Erro ao carregar scripts do chat:", err);
        }
      }
            

      // Eventos pós-render e carregamento dinâmico de script
      attachEventsAfterRender(route, match.groups || {});
      return;
    }
  }

  // Se nenhuma rota casar => 404
  document.getElementById("root").innerHTML =
    "<h1>404 - Página não encontrada</h1>";
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
      }
    } catch (err) {
      console.error(`Erro ao carregar script ${route.script}:`, err);
    }
  }

  // 8.2. Seletor de idioma (opcional, caso não esteja no navbar.js)
  // document.querySelectorAll("[data-lang]").forEach((langEl) => {
  //   langEl.addEventListener("click", () => {
  //     const lang = langEl.getAttribute("data-lang");
  //     console.log("Mudando idioma para:", lang);
  //     // Implemente a lógica de troca de idioma, se necessário
  //   });
  // });
}

/* ========== 9. Início da aplicação ========== */
document.addEventListener("DOMContentLoaded", () => {
  handleRoute();
});

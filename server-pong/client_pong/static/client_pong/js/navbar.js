// navbar.js
// Exemplo de função global para inicializar a navbar após injetar o HTML.

window.initNavbar = function() {
    console.log("initNavbar chamado!");
  
    // 1) Selecionar elementos do DOM
    const navbarAvatar = document.getElementById("navbarAvatar");
    const navbarProfileLink = document.getElementById("navbarProfileLink");
    const btnLogout = document.getElementById("btnLogout");
  
    // 2) Buscar dados do usuário do localStorage (ou faça outro fetch)
    //    Supondo que em "renderPrivateLayout" ou outro lugar você já guardou:
    //    localStorage.setItem("id", "123");
    //    localStorage.setItem("avatarUrl", "http://...");
    //    localStorage.setItem("displayName", "Fulano");
    const userId = localStorage.getItem("id") || "0";
    // const avatarUrl = localStorage.getItem("avatarUrl") || "/static/client_pong/avatars/default.png";
    const avatarUrl = "/static/client_pong/avatars/default.png";
    const displayName = localStorage.getItem("displayName") || "";
  
    // 3) Injetar avatar e link de perfil
    if (navbarAvatar) {
      navbarAvatar.src = avatarUrl; // se o usuário tiver um avatar custom, trocará o default
    }
    if (navbarProfileLink) {
      navbarProfileLink.href = `/pong/user-profile/${userId}`;
    }
  
    // 4) Lidar com logout
    if (btnLogout) {
      btnLogout.addEventListener("click", async () => {
        try {
          const access = localStorage.getItem("access");
          const refresh = localStorage.getItem("refresh");
          if (refresh) {
            // Chama a rota de logout no backend
            await fetch(`/api/user-management/logout/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access}`,
              },
              body: JSON.stringify({ refresh }),
            });
          }
        } catch (err) {
          console.error("Erro ao deslogar:", err);
        } finally {
          // Limpa tokens e ID do localStorage
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          localStorage.removeItem("id");
          localStorage.removeItem("avatarUrl");
          localStorage.removeItem("displayName");
  
          // Redireciona para /pong/
          window.location.href = "/pong/";
        }
      });
    }
  
    // 5) Lógica de idioma (dummy)
    document.querySelectorAll("[data-lang]").forEach((langEl) => {
      langEl.addEventListener("click", () => {
        const lang = langEl.getAttribute("data-lang");
        console.log("Mudando idioma para:", lang);
        // Se tiver i18n real, chame ex: i18n.changeLanguage(lang);
      });
    });
  };
  
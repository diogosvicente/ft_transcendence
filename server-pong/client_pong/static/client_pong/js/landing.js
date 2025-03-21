// Exemplo de endpoint base da API
const API_BASE_URL = "http://127.0.0.1:8000"; // Ajuste conforme seu backend

// Exemplo de função fictícia de WebSocket
function initializeNotificationWebSocket(access, userId, context) {
  console.log("WebSocket init =>", { access, userId, context });
  // Aqui você implementaria a lógica real de WebSocket, se necessário
}

// Em vez de DOMContentLoaded, definimos uma função global
window.initLanding = function() {
  console.log("initLanding chamado!"); // Para debug

  // ==========================================================
  // A) Verificar se usuário já está logado
  // ==========================================================
  const accessToken = localStorage.getItem("access");
  if (accessToken) {
    // Se já estiver logado, redireciona para /home
    window.location.href = "/pong/home";
    return; // Impede que continue a lógica de login/registro
  }

  // ==========================================================
  // B) Selecionar elementos do DOM
  // ==========================================================
  // Login
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const login2FAContainer = document.getElementById("login2FAContainer");
  const login2FACode = document.getElementById("login2FACode");
  const validate2FABtn = document.getElementById("validate2FABtn");
  const loginSuccessAlert = document.getElementById("loginSuccessAlert");
  const loginErrorAlert = document.getElementById("loginErrorAlert");
  let is2FARequired = false;

  // Register
  const registerForm = document.getElementById("registerForm");
  const registerEmail = document.getElementById("registerEmail");
  const displayName = document.getElementById("displayName");
  const registerPassword = document.getElementById("registerPassword");
  const passwordRequirements = {
    reqMinLength: document.getElementById("reqMinLength"),
    reqUppercase: document.getElementById("reqUppercase"),
    reqLowercase: document.getElementById("reqLowercase"),
    reqNumber: document.getElementById("reqNumber"),
    reqSpecialChar: document.getElementById("reqSpecialChar"),
  };
  const avatarInput = document.getElementById("avatarInput");
  const removeAvatarBtn = document.getElementById("removeAvatarBtn");
  const registerSuccessAlert = document.getElementById("registerSuccessAlert");
  const registerErrorAlert = document.getElementById("registerErrorAlert");

  // Botão local match
  const btnLocalMatch = document.getElementById("btnLocalMatch");

  // Botões de toggle de senha
  const toggleLoginPassword = document.getElementById("toggleLoginPassword");
  const toggleRegisterPassword = document.getElementById("toggleRegisterPassword");

  // ==========================================================
  // C) Funções auxiliares
  // ==========================================================
  function showAlert(alertElement, message) {
    alertElement.textContent = message;
    alertElement.classList.remove("d-none");
  }
  function hideAlert(alertElement) {
    alertElement.classList.add("d-none");
  }

  // Valida se string é email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function isPasswordValid(password) {
    const minLength = password.length >= 12;
    const uppercase = /[A-Z]/.test(password);
    const lowercase = /[a-z]/.test(password);
    const number = /[0-9]/.test(password);
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return { minLength, uppercase, lowercase, number, specialChar };
  }

  function updatePasswordRequirements(password) {
    const checks = isPasswordValid(password);
    passwordRequirements.reqMinLength.style.color = checks.minLength ? "green" : "red";
    passwordRequirements.reqUppercase.style.color = checks.uppercase ? "green" : "red";
    passwordRequirements.reqLowercase.style.color = checks.lowercase ? "green" : "red";
    passwordRequirements.reqNumber.style.color = checks.number ? "green" : "red";
    passwordRequirements.reqSpecialChar.style.color = checks.specialChar ? "green" : "red";
  }

  // ==========================================================
  // D) Lógica do Login
  // ==========================================================
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Impede envio padrão (GET)
      hideAlert(loginSuccessAlert);
      hideAlert(loginErrorAlert);

      const email = loginEmail.value.trim();
      const password = loginPassword.value.trim();

      // Verifica se email e senha foram preenchidos
      if (!email || !password) {
        showAlert(loginErrorAlert, "Email e senha são obrigatórios.");
        return;
      }

      // Verifica se email é válido
      if (!isValidEmail(email)) {
        showAlert(loginErrorAlert, "Email inválido.");
        return;
      }

      // Faz POST via fetch()
      try {
        const response = await fetch(`${API_BASE_URL}/api/user-management/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (response.ok) {
          if (data.requires_2fa) {
            // Mostra campo de 2FA + botão de validar
            is2FARequired = true;
            login2FAContainer.style.display = "block";
            showAlert(loginSuccessAlert, "2FA requerido. Insira o código.");
          } else {
            showAlert(loginSuccessAlert, "Login efetuado com sucesso!");
            localStorage.setItem("access", data.access);
            localStorage.setItem("refresh", data.refresh);
            localStorage.setItem("id", data.id);

            // Inicializa WebSockets
            initializeNotificationWebSocket(data.access, data.id, "handleLogin");

            // Redireciona e recarrega
            window.location.href = "/home";
            window.location.reload();
          }
        } else {
          showAlert(loginErrorAlert, data.error || "Credenciais inválidas.");
        }
      } catch (err) {
        showAlert(loginErrorAlert, "Erro de conexão.");
      }
    });
  }

  // Botão para validar 2FA
  if (validate2FABtn) {
    validate2FABtn.addEventListener("click", async () => {
      if (!is2FARequired) return;
      hideAlert(loginErrorAlert);
      hideAlert(loginSuccessAlert);

      const email = loginEmail.value.trim();
      const code = login2FACode.value.trim();
      if (!code) {
        showAlert(loginErrorAlert, "Código 2FA é obrigatório.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/user-management/2fa/validate/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        const data = await response.json();
        if (response.ok) {
          showAlert(loginSuccessAlert, "2FA validado com sucesso!");
          localStorage.setItem("access", data.access);
          localStorage.setItem("refresh", data.refresh);
          localStorage.setItem("id", data.id);

          window.location.href = "/home";
          window.location.reload();
        } else {
          showAlert(loginErrorAlert, data.error || "Código 2FA inválido.");
        }
      } catch (err) {
        showAlert(loginErrorAlert, "Erro de conexão.");
      }
    });
  }

  // ==========================================================
  // E) Lógica do Registro
  // ==========================================================
  // Atualiza requisitos de senha em tempo real
  if (registerPassword) {
    registerPassword.addEventListener("input", () => {
      updatePasswordRequirements(registerPassword.value);
    });
  }

  // Lida com upload de avatar
  if (avatarInput) {
    avatarInput.addEventListener("change", () => {
      const file = avatarInput.files[0];
      if (file && file.size > 1024 * 1024) {
        alert("O tamanho do avatar deve ser no máximo 1MB.");
        avatarInput.value = "";
        removeAvatarBtn.classList.add("d-none");
      } else if (file) {
        removeAvatarBtn.classList.remove("d-none");
      }
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener("click", () => {
      avatarInput.value = "";
      removeAvatarBtn.classList.add("d-none");
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Impede envio padrão
      hideAlert(registerSuccessAlert);
      hideAlert(registerErrorAlert);

      const email = registerEmail.value.trim();
      const dName = displayName.value.trim();
      const password = registerPassword.value;

      if (!email || !dName || !password) {
        showAlert(registerErrorAlert, "Preencha todos os campos obrigatórios.");
        return;
      }

      // Validação de e-mail
      if (!isValidEmail(email)) {
        showAlert(registerErrorAlert, "Email inválido.");
        return;
      }

      // Validação de senha
      const checks = isPasswordValid(password);
      const allValid = Object.values(checks).every(Boolean);
      if (!allValid) {
        showAlert(registerErrorAlert, "A senha não atende aos requisitos.");
        return;
      }

      // Monta formData
      const formDataToSend = new FormData();
      formDataToSend.append("email", email);
      formDataToSend.append("password", password);
      formDataToSend.append("display_name", dName);

      if (avatarInput.files[0]) {
        formDataToSend.append("avatar", avatarInput.files[0]);
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/user-management/register/`, {
          method: "POST",
          body: formDataToSend,
        });
        const data = await response.json();
        if (response.ok) {
          showAlert(registerSuccessAlert, "Usuário registrado com sucesso!");
          // Alterna para aba de login
          const loginTabBtn = document.getElementById("login-tab");
          loginTabBtn.click();
        } else {
          if (data.email) {
            showAlert(registerErrorAlert, "Este email já está em uso.");
          } else if (data.display_name) {
            showAlert(registerErrorAlert, "Este display_name já está em uso.");
          } else {
            showAlert(registerErrorAlert, "Erro desconhecido ao registrar.");
          }
        }
      } catch (err) {
        showAlert(registerErrorAlert, "Erro de conexão.");
      }
    });
  }

  // ==========================================================
  // F) Mostrar/Esconder senha
  // ==========================================================
  if (toggleLoginPassword) {
    toggleLoginPassword.addEventListener("click", () => {
      if (loginPassword.type === "password") {
        loginPassword.type = "text";
        toggleLoginPassword.innerHTML = '<i class="fas fa-eye-slash"></i>';
      } else {
        loginPassword.type = "password";
        toggleLoginPassword.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });
  }

  if (toggleRegisterPassword) {
    toggleRegisterPassword.addEventListener("click", () => {
      if (registerPassword.type === "password") {
        registerPassword.type = "text";
        toggleRegisterPassword.innerHTML = '<i class="fas fa-eye-slash"></i>';
      } else {
        registerPassword.type = "password";
        toggleRegisterPassword.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });
  }

  // ==========================================================
  // G) Botão Partida Local
  // ==========================================================
  if (btnLocalMatch) {
    btnLocalMatch.addEventListener("click", () => {
      window.location.href = "/pong/local-match";
    });
  }

  // ==========================================================
  // H) Lógica de Idioma (Dummy)
  // ==========================================================
  document.querySelectorAll(".language-card").forEach((card) => {
    card.addEventListener("click", () => {
      const lang = card.getAttribute("data-lang");
      alert("Mudando idioma para: " + lang);
      // Implemente sua lógica real de i18n ou recarregue a página com param de idioma etc.
    });
  });
};

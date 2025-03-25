// config.js

// Define as variáveis e funções como propriedades do objeto global "window"
window.API_LANGUAGE = localStorage.getItem("language") || "en";

window.setApiLanguage = (language) => {
  window.API_LANGUAGE = language;
  localStorage.setItem("language", language);
};

window.API_BASE_URL = "https://192.168.1.138:4443";

window.DEFAULT_AVATAR = `${window.API_BASE_URL}/media/avatars/default.png`;

window.getAvatar = (avatarPath) => {
  if (!avatarPath) return window.DEFAULT_AVATAR;

  // Garante que o caminho final seja correto
  return avatarPath.startsWith("/media/")
    ? avatarPath
    : `/media/${avatarPath}`;
};

window.getWsUrl = (path = "") => {
  return "wss://192.168.1.138:4443" + path;  // e.g. /ws/chat/
};

// src/config/config.js

// Configuração de idioma
let API_LANGUAGE = localStorage.getItem("language") || "en";

export const setApiLanguage = (language) => {
  API_LANGUAGE = language;
  localStorage.setItem("language", language);
};

// URLs Base
export const API_BASE_URL = "https://192.168.1.138";

// Avatar padrão
export const DEFAULT_AVATAR = `${API_BASE_URL}/media/avatars/default.png`;

// Função para obter o avatar
export const getAvatar = (avatarPath) => {
  if (!avatarPath) return DEFAULT_AVATAR;
  return avatarPath.startsWith("/media/")
    ? `${API_BASE_URL}${avatarPath}`
    : `${API_BASE_URL}/media/${avatarPath}`;
};

// Função para obter a URL do WebSocket
export const getWsUrl = (path = "") => {
  return "wss://192.168.1.138" + path;  // e.g. /ws/chat/
};

// Exportação padrão
export default API_BASE_URL;
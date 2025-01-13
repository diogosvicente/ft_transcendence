// src/config/config.js
let API_LANGUAGE = localStorage.getItem("language") || "en"; // Idioma padrão

export const setApiLanguage = (language) => {
  API_LANGUAGE = language;
  localStorage.setItem("language", language); // Salva o idioma no localStorage
};

// const API_BASE_URL = `http://127.0.0.1:8000/${API_LANGUAGE}`;
const API_BASE_URL = `http://127.0.0.1:8000`;
const API_BASE_URL_NO_LANGUAGE = `http://127.0.0.1:8000`; // URL base sem idioma

// Avatar default
const DEFAULT_AVATAR = `${API_BASE_URL_NO_LANGUAGE}/media/avatars/default.png`;

// Função para obter o avatar
export const getAvatar = (avatarPath) => {
  if (!avatarPath) return DEFAULT_AVATAR;
  if (!avatarPath.startsWith("/media/")) {
    return `${API_BASE_URL_NO_LANGUAGE}/media/${avatarPath}`;
  }
  return `${API_BASE_URL_NO_LANGUAGE}${avatarPath}`;
};

export { API_BASE_URL_NO_LANGUAGE, DEFAULT_AVATAR }; // Exporta a URL base sem idioma e o avatar padrão
export default API_BASE_URL; // Exporta a URL base com idioma

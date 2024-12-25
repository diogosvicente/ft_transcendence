// src/config/apiConfig.js
let API_LANGUAGE = localStorage.getItem("language") || "en"; // Idioma padrão

export const setApiLanguage = (language) => {
  API_LANGUAGE = language;
  localStorage.setItem("language", language); // Salva o idioma no localStorage
};

const API_BASE_URL = `http://127.0.0.1:8000/${API_LANGUAGE}`;
const API_BASE_URL_NO_LANGUAGE = `http://127.0.0.1:8000`; // URL base sem idioma

export { API_BASE_URL_NO_LANGUAGE }; // Exporta a URL base sem idioma
export default API_BASE_URL; // Exporta a URL base com idioma

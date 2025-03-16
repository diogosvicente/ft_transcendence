import axios from "axios";
import API_BASE_URL from "../../assets/config/config.js";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "./locales/en/translation.json";
import esTranslation from "./locales/es/translation.json";
import ptBRTranslation from "./locales/pt_BR/translation.json";

i18n
  .use(initReactI18next) // Conecta o i18next ao React
  .init({
    fallbackLng: "pt_BR", // Idioma padrão (fallback)
    lng: "pt_BR", // Idioma inicial (pode ser alterado)
    // debug: true, // Habilitar para logs durante o desenvolvimento
    interpolation: {
      escapeValue: false, // React já trata os escapes
    },
    resources: {
      en: { translation: enTranslation },
      es: { translation: esTranslation },
      pt_BR: { translation: ptBRTranslation },
    },
  });

// Escuta o evento de mudança de idioma e atualiza o banco de dados
i18n.on("languageChanged", (lng) => {
  // Recupera os dados de autenticação do usuário (ajuste conforme seu fluxo)
  const accessToken = localStorage.getItem("access");
  const userId = localStorage.getItem("id");

  if (accessToken && userId) {
    axios.put(
      `${API_BASE_URL}/api/user-management/user/${userId}/language/`,
      { language: lng },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    .then((response) => {
      console.log("Idioma atualizado com sucesso no banco de dados:", response.data.current_language);
    })
    .catch((error) => {
      console.error("Erro ao atualizar o idioma no banco de dados:", error);
    });
  }
});

export default i18n;

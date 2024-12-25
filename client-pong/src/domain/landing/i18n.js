import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "../../locales/en/translation.json";
import esTranslation from "../../locales/es/translation.json";
import ptBRTranslation from "../../locales/pt_BR/translation.json";

i18n
  .use(initReactI18next) // Conecta o i18next ao React
  .init({
    fallbackLng: "pt_BR", // Idioma padrão (fallback)
    lng: "pt_BR", // Idioma inicial (pode ser alterado)
    debug: true, // Habilitar para logs durante o desenvolvimento
    interpolation: {
      escapeValue: false, // React já trata os escapes
    },
    resources: {
      en: { translation: enTranslation },
      es: { translation: esTranslation },
      pt_BR: { translation: ptBRTranslation },
    },
  });

export default i18n;

// server-pong/client_pong/static/client_pong/locales/i18n.js

(async function () {

  if (window.i18nAlreadyInitialized) {
    // Se já inicializamos i18n e os listeners, não faça de novo
    return;
  }
  window.i18nAlreadyInitialized = true;
  
  // 1) Carrega JSON (en, es, pt_BR)
  const [enData, esData, ptBRData] = await Promise.all([
    fetch('/static/client_pong/locales/en/translation.json').then(r => r.json()),
    fetch('/static/client_pong/locales/es/translation.json').then(r => r.json()),
    fetch('/static/client_pong/locales/pt_BR/translation.json').then(r => r.json()),
  ]);

  // 2) Monta o objeto resources
  const resources = {
    en:    { translation: enData },
    es:    { translation: esData },
    pt_BR: { translation: ptBRData },
  };

  // 3) Inicializa o i18next (assíncrono)
  await i18next.init({
    resources,
    fallbackLng: 'pt_BR',
    lng: 'pt_BR',
    interpolation: { escapeValue: false },
  });

  i18next.on("languageChanged", (lng) => {
    console.log("Idioma mudou para:", lng);
    if (window.reRenderCurrentRoute) {
      window.reRenderCurrentRoute();
    }
  });

  // 4) Escuta quando o idioma for alterado, para atualizar no backend (opcional)
  i18next.on('languageChanged', (lng) => {
    const accessToken = localStorage.getItem('access');
    const userId = localStorage.getItem('id');
    if (accessToken && userId) {
      fetch(`${API_BASE_URL}/api/user-management/user/${userId}/language/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ language: lng }),
      })
        .then(res => res.json())
        .then(data => {
          console.log('Idioma atualizado no banco:', data.current_language);
        })
        .catch(error => {
          console.error('Erro ao atualizar idioma no backend:', error);
        });
    }
  });

  // 5) Expor i18n e criar função global t
  window.i18n = i18next;
  window.t = function (key, options) {
    return window.i18n.t(key, options);
  };

  // 6) Disparar evento indicando que i18n está pronto
  document.dispatchEvent(new Event('i18nLoaded'));
})();

document.addEventListener("DOMContentLoaded", function () {
    async function getUserInfo() {
        const userId = localStorage.getItem("id");
        const accessToken = localStorage.getItem("access");

        // Espera até o elemento 'username' estar disponível
        let usernameElement = document.getElementById("displayName");
        if (!usernameElement) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Aguarda 500ms
            usernameElement = document.getElementById("displayName");

            if (!usernameElement) {
                return;
            }
        }


        if (!userId || !accessToken) {
            console.warn("Usuário não logado. Usando nome padrão.");
            usernameElement.textContent = "Jogador";
            return;
        }

        try {
            console.log(`Buscando informações do usuário com ID: ${userId}`);

            const response = await fetch(`${API_BASE_URL}/api/user-management/user-info/${userId}/`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.display_name) {
                usernameElement.textContent = data.display_name;
            } else {
                console.warn("Campo display_name não encontrado na resposta da API.");
                usernameElement.textContent = "Jogador";
            }
        } catch (error) {
            console.error("Erro ao buscar informações do usuário:", error);
            usernameElement.textContent = "Jogador";
        }
    }

    getUserInfo();
});

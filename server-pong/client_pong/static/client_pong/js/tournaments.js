document.addEventListener('DOMContentLoaded', () => {
    // Formulário de criação de torneio
    const form = document.getElementById('create-tournament-form');
    const createButton = document.getElementById('create-tournament-btn');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // Função para carregar os torneios criados
    async function carregarTorneios() {
        try {
            const response = await fetch('/api/tournaments/');
            const torneios = await response.json();
            const torneiosSection = document.getElementById('torneios');
            torneiosSection.innerHTML = '';  // Limpa os torneios existentes

            torneios.forEach(torneio => {
                const torneioDiv = criarTorneio(torneio);
                torneiosSection.appendChild(torneioDiv);
            });
        } catch (error) {
            console.error("Erro ao carregar torneios:", error);
        }
    }

    // Função para criar um elemento do torneio
    function criarTorneio(torneio) {
        const torneioDiv = document.createElement('div');
        torneioDiv.className = 'torneio';

        const titulo = document.createElement('h2');
        titulo.textContent = torneio.name;

        const descricao = document.createElement('p');
        descricao.textContent = `Criado por: ${torneio.creator}`;

        const data = document.createElement('p');
        data.textContent = `Data: ${new Date(torneio.created_at).toLocaleDateString()}`;

        torneioDiv.appendChild(titulo);
        torneioDiv.appendChild(descricao);
        torneioDiv.appendChild(data);

        return torneioDiv;
    }

    // Função para inicializar o carregamento dos torneios
    function initTournaments() {
        console.log("Inicializando torneios...");
        carregarTorneios();  // Chama a função para carregar os torneios criados
    }

    // Evento de envio do formulário para criar o torneio
    form.addEventListener('submit', async (event) => {
        event.preventDefault();  // Impede o envio padrão do formulário (evita o recarregamento da página)

        const tournamentName = document.getElementById('tournament-name').value;
        const tournamentAlias = document.getElementById('tournament-alias').value;

        // Limpar mensagens de erro ou sucesso
        errorMessage.textContent = '';
        successMessage.textContent = '';

        // Validar os campos
        if (!tournamentName || !tournamentAlias) {
            errorMessage.textContent = 'Todos os campos são obrigatórios.';
            return;
        }

        // Enviar dados para a API para criar o torneio
        const data = {
            name: tournamentName,
            alias: tournamentAlias,
        };

        try {
            const response = await fetch('/api/tournaments/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                errorMessage.textContent = errorData.error || 'Erro ao criar o torneio.';
            } else {
                const responseData = await response.json();
                successMessage.textContent = `Torneio '${responseData.tournament.name}' criado com sucesso!`;
                // Limpar campos
                form.reset();
                // Atualiza a lista de torneios
                carregarTorneios();  // A chamada para carregar os torneios, exibindo-os na tela
            }
        } catch (error) {
            errorMessage.textContent = 'Erro de rede. Tente novamente mais tarde.';
            console.error(error);
        }
    });

    // Carregar os torneios quando a página carregar
    initTournaments();
});

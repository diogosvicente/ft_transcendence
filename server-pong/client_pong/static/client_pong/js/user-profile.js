// static/client_pong/js/user-profile.js

// Mostrar formulário de edição
function showEditForm() {
    document.getElementById('edit-profile-form').classList.remove('d-none');
    document.getElementById('profile-content').classList.add('d-none');
}

// Cancelar edição
function cancelEdit() {
    document.getElementById('edit-profile-form').classList.add('d-none');
    document.getElementById('profile-content').classList.remove('d-none');
}

// Enviar alterações (exemplo básico)
async function saveProfileChanges(user_id) {
    const newName = document.getElementById('display-name').value;
    const avatarFile = document.getElementById('avatar-upload').files[0];
    console.log(newName)

    try {
        const formData = new FormData();
        if (newName) formData.append('display_name', newName);
        if (avatarFile) formData.append('avatar', avatarFile);

        const response = await fetch(`/api/user-management/user-profile/${user_id}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access')}`
            },
            body: formData
        });

        if (response.ok) {
            window.location.reload(); // Recarrega os dados atualizados
        }
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
    }
}

window.initUserProfile = async () => {
    // Elementos do DOM
    const elements = {
        loading: document.getElementById('profile-loading'),
        error: document.getElementById('profile-error'),
        content: document.getElementById('profile-content'),
        avatar: document.getElementById('profile-avatar'),
        username: document.getElementById('profile-username'),
        wins: document.getElementById('stats-wins'),
        losses: document.getElementById('stats-losses'),
        winrate: document.getElementById('stats-winrate'),
        matchList: document.getElementById('match-history-list')
    };

    // Estado inicial
    let state = {
        user: null,
        matches: [],
        error: null
    };

    // Helpers
    const showError = (message) => {
        elements.error.textContent = message;
        elements.error.classList.remove('d-none');
        elements.content.classList.add('d-none');
        elements.loading.classList.add('d-none');
    };

    // Obter user_id da URL
    const pathSegments = window.location.pathname.split('/');
    const user_id = pathSegments[pathSegments.length - 1];

    const loggedUserId = localStorage.getItem('id');
    const isOwnProfile = parseInt(user_id) === parseInt(loggedUserId);

    try {
        const accessToken = localStorage.getItem('access');

        // Buscar dados do usuário
        const userRes = await fetch(`/api/user-management/user-profile/${user_id}/`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!userRes.ok) throw new Error('Falha ao carregar perfil');

        const userData = await userRes.json();

        // Buscar histórico de partidas
        const matchesRes = await fetch(`/api/game/match-history/${user_id}/`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!matchesRes.ok) throw new Error('Falha ao carregar histórico');

        // Not implemented yet
        const matchesData = await matchesRes.json();

        // Atualizar estado
        state = { ...state, user: userData, matches: matchesData };

        // Atualizar UI
        elements.loading.classList.add('d-none');
        elements.content.classList.remove('d-none');

        // Preencher dados
        elements.avatar.src = userData.avatar
            ? `http://localhost:8000${userData.avatar}`
            : '/static/client_pong/avatars/default.png';
        elements.avatar.src += `?v=${new Date().getTime()}`;

        elements.username.textContent = userData.display_name;
        elements.wins.textContent = userData.wins || 0;
        elements.losses.textContent = userData.losses || 0;

        const totalMatches = (userData.wins || 0) + (userData.losses || 0);
        const winRate = totalMatches > 0
            ? ((userData.wins / totalMatches) * 100).toFixed(2)
            : 0;
        elements.winrate.textContent = `${winRate}%`;

        // Preencher histórico
        elements.matchList.innerHTML = state.matches.map(match => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${new Date(match.date).toLocaleDateString()}</span>
        <span class="badge ${match.winner_id === user_id ? 'bg-success' : 'bg-danger'}">
          ${match.winner_id === user_id ? 'Vitória' : 'Derrota'}
        </span>
      </li>
    `).join('');

        if (isOwnProfile) {
            document.getElementById('edit-profile-btn').classList.remove('d-none');
            document.getElementById('edit-profile-btn').addEventListener('click', showEditForm);
            document.getElementById('profile-form').addEventListener('submit', (e) => {
                e.preventDefault();
                saveProfileChanges(user_id);
            });
        }

    } catch (err) {
        console.error('Erro no perfil:', err);
        showError(err.message || 'Erro ao carregar o perfil');
    }
};

// Verificar se é o próprio perfil
function checkOwnProfile(userId) {
    const loggedId = localStorage.getItem('id');
    return parseInt(loggedId, 10) === parseInt(userId, 10);
}

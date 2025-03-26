(function() {
    // Variável local para armazenar os dados atuais do usuário
    let currentUser = null;

    // Função que verifica se a senha atende aos requisitos
    function isPasswordValid(password) {
        const minLength = password.length >= 12;
        const uppercase = /[A-Z]/.test(password);
        const lowercase = /[a-z]/.test(password);
        const number = /[0-9]/.test(password);
        const specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return { minLength, uppercase, lowercase, number, specialChar };
    }

    // Função que atualiza os elementos de feedback dos requisitos da senha
    function updatePasswordRequirements(password) {
        const checks = isPasswordValid(password);
        // Certifique-se de que esses elementos estão presentes no HTML do formulário de edição
        document.getElementById('reqMinLength').style.color = checks.minLength ? "green" : "red";
        document.getElementById('reqUppercase').style.color = checks.uppercase ? "green" : "red";
        document.getElementById('reqLowercase').style.color = checks.lowercase ? "green" : "red";
        document.getElementById('reqNumber').style.color = checks.number ? "green" : "red";
        document.getElementById('reqSpecialChar').style.color = checks.specialChar ? "green" : "red";
    }

    // Enviar alterações (exemplo básico)
    async function saveProfileChanges(user_id) {
        const newName = document.getElementById('display-name').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const enable2FA = document.getElementById('2fa-switch').checked;
        const avatarFile = document.getElementById('avatar-upload').files[0];

        // Validação de senha: se houver nova senha, confirma se os campos coincidem
        if (newPassword && newPassword !== confirmPassword) {
            showError('As senhas não coincidem!');
            return;
        }

        try {
            const formData = new FormData();
            if (newName) formData.append('display_name', newName);
            if (newPassword) formData.append('password', newPassword);
            formData.append('is_2fa_verified', enable2FA);
            if (avatarFile) formData.append('avatar', avatarFile);

            const response = await fetch(`${API_BASE_URL}/api/user-management/user-profile/${user_id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access')}`,
                    'X-CSRFToken': getCSRFToken(),
                },
                body: formData
            });

            if (response.ok) {
                const updatedData = await response.json();

                // Atualiza a UI com os novos dados
                updateProfileUI(updatedData);

                // Oculta o formulário e mostra o perfil novamente
                document.getElementById('edit-profile-form').classList.add('d-none');
                document.getElementById('profile-content').classList.remove('d-none');

                showSuccess('Alterações salvas com sucesso!');
            } else {
                const errorData = await response.json();
                showError(errorData.error || 'Erro ao atualizar perfil');
            }
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            showError('Erro de conexão com o servidor');
        }
    }

    // Função para atualizar a UI com os novos dados do perfil
    function updateProfileUI(updatedData) {
        document.getElementById('profile-username').textContent = updatedData.display_name;
        document.getElementById('stats-wins').textContent = updatedData.wins;
        document.getElementById('stats-losses').textContent = updatedData.losses;
        document.getElementById('stats-winrate').textContent = `${updatedData.winrate}%`;

        // Atualiza o avatar (adiciona timestamp para evitar cache)
        if (updatedData.avatar_url) {
            const avatarImg = document.getElementById('profile-avatar');
            avatarImg.src = updatedData.avatar_url + '?t=' + Date.now();
        }
    }

    // Função para carregar os dados atuais no formulário de edição (pré-preencher campos)
    function loadCurrentSettings(userData) {
        document.getElementById('display-name').value = userData.display_name || '';
        document.getElementById('2fa-switch').checked = userData.is_2fa_verified || false;
        // Opcional: limpar os campos de senha para não exibir valores antigos
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        // Atualiza os requisitos de senha com valor vazio
        updatePasswordRequirements('');
    }

    window.initUserProfile = async () => {
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

        let state = {
            user: null,
            matches: [],
            error: null
        };

        const showError = (message) => {
            elements.error.textContent = message;
            elements.error.classList.remove('d-none');
            elements.content.classList.add('d-none');
            elements.loading.classList.add('d-none');
        };

        const pathSegments = window.location.pathname.split('/');
        const user_id = pathSegments[pathSegments.length - 1];

        const loggedUserId = localStorage.getItem('id');
        const isOwnProfile = parseInt(user_id) === parseInt(loggedUserId);

        try {
            const accessToken = localStorage.getItem('access');

            // Buscar dados do usuário
            const userRes = await fetch(`${API_BASE_URL}/api/user-management/user-profile/${user_id}/`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!userRes.ok) throw new Error('Falha ao carregar perfil');

            const userData = await userRes.json();
            currentUser = userData; // Armazena os dados atuais para uso no formulário de edição

            // Buscar histórico de partidas
            const matchesRes = await fetch(`${API_BASE_URL}/api/game/match-history/${user_id}/`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!matchesRes.ok) throw new Error('Falha ao carregar histórico');

            const matchesData = await matchesRes.json();

            state = { ...state, user: userData, matches: matchesData };

            elements.loading.classList.add('d-none');
            elements.content.classList.remove('d-none');

            // Preencher dados do perfil
            elements.avatar.src = userData.avatar
                ? `${API_BASE_URL}${userData.avatar}`
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

            elements.matchList.innerHTML = state.matches.map(match => `
                <li class="list-group-item">
                  <div class="d-flex justify-content-between align-items-center">
                    <span>${new Date(match.date).toLocaleDateString()}</span>
                    <span class="badge ${
                        match.result === "Derrota" ? 'bg-danger' :
                        match.result === "Vitória" ? 'bg-success' :
                        'bg-warning'
                    }">
                      ${match.result === "Derrota" || match.result === "Vitória" ? match.result : "Não disputada"}
                    </span>
                  </div>
                  <div class="mt-2">
                    <strong>Oponente:</strong> ${match.opponent_display_name}${match.opponent_alias ? ' (' + match.opponent_alias + ')' : ''}
                  </div>
                  <div>
                    <strong>Placar:</strong> ${match.score.player1} x ${match.score.player2}
                  </div>
                  ${match.tournament_name ? `<div><strong>Torneio:</strong> ${match.tournament_name}</div>` : ''}
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

        // Adiciona listener para feedback em tempo real dos requisitos da nova senha
        const newPasswordField = document.getElementById('new-password');
        if (newPasswordField) {
            newPasswordField.addEventListener('input', function() {
                updatePasswordRequirements(this.value);
            });
        }
    };

    function checkOwnProfile(userId) {
        const loggedId = localStorage.getItem('id');
        return parseInt(loggedId, 10) === parseInt(userId, 10);
    }

    function showError(message, duration = 5000) {
        const errorElement = document.getElementById('profile-error');
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
        setTimeout(() => {
            errorElement.classList.add('d-none');
        }, duration);
    }

    function showSuccess(mensagem) {
        const errorDiv = document.getElementById('profile-error');
        errorDiv.textContent = mensagem;
        errorDiv.classList.remove('d-none', 'alert-danger');
        errorDiv.classList.add('alert-success');
        setTimeout(() => errorDiv.classList.add('d-none'), 3000);
    }

    // Mostrar formulário de edição e pré-carregar dados atuais
    function showEditForm() {
        if (currentUser) {
            loadCurrentSettings(currentUser);
        }
        document.getElementById('edit-profile-form').classList.remove('d-none');
        document.getElementById('profile-content').classList.add('d-none');
    }

    // Cancelar edição e resetar formulário
    function cancelEdit() {
        document.getElementById('edit-profile-form').classList.add('d-none');
        document.getElementById('profile-content').classList.remove('d-none');
        document.getElementById('profile-form').reset();
    }

    function getCSRFToken() {
        return document.cookie.split('csrftoken=')[1].split(';')[0];
    }
})();

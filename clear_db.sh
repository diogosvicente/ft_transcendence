#!/bin/bash

# Define o nome do banco e do usuário do PostgreSQL
DB_NAME="ft_transcendence"
DB_USER="postgres"

# Comando para truncar as tabelas no PostgreSQL dentro do container Docker
docker compose exec db psql -U $DB_USER -d $DB_NAME -c "
TRUNCATE TABLE 
    chat_blockeduser,
    chat_friend,
    chat_message,
    game_match,
    game_tournament,
    game_tournamentparticipant,
    token_blacklist_blacklistedtoken,
    token_blacklist_outstandingtoken,
    user_management_user
RESTART IDENTITY CASCADE;
"

echo "✅ Tabelas limpas com sucesso!"

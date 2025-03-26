name = ft_transcendence

# Descobre o caminho atual (se precisar)
PROJECT_PATH ?= $(shell pwd)

# Aponta para o arquivo docker-compose.yml (gerado pelo setup.sh)
DOCKER_COMPOSE_FILE = $(PROJECT_PATH)/docker-compose.yml

# -----------------------------------------------------------------------------
# 1) 'setup' chama o seu setup.sh, que:
#    - Pede IP
#    - Cria /goinfre/$USER (ou ~/goinfre) e subpastas
#    - Gera docker-compose.yml via template
#    - Gera .env, nginx.conf, etc.
# -----------------------------------------------------------------------------
setup:
	@printf "🔄 Executando setup.sh...\n"
	@chmod +x ./setup.sh
	@./setup.sh

# -----------------------------------------------------------------------------
# 2) Alvo 'up' sobe os serviços e depois executa as migrations
# -----------------------------------------------------------------------------
up:
	@printf "🚀 Subindo serviços com docker-compose...\n"
	@docker compose -f $(DOCKER_COMPOSE_FILE) up -d --build

	@printf "⏳ Aguardando containers e executando migrations...\n"
	@docker compose -f $(DOCKER_COMPOSE_FILE) exec -it web python manage.py migrate

	@printf "✅ Copiando arquivos estáticos...\n"
	@docker compose -f $(DOCKER_COMPOSE_FILE) exec -it web cp -R /app/client_pong/static/client_pong/ /app/staticfiles/

down:
	@printf "🛑 Parando serviços...\n"
	@docker compose -f $(DOCKER_COMPOSE_FILE) down

# -----------------------------------------------------------------------------
# 3) Reinicialização completa: remove tudo (fclean) e depois sobe (up)
# -----------------------------------------------------------------------------
re: fclean up
	@printf "🔄 Reinicialização completa para $(name)...\n"

# -----------------------------------------------------------------------------
# 4) Limpeza parcial e total
# -----------------------------------------------------------------------------

clean: down
	@printf "🧹 Limpando configuração $(name)...\n"
	@docker system prune -a --volumes --force

# fclean remove containers/imagens e também a pasta de volumes
fclean:
	@printf "🔥 Limpeza total de todas as configurações do Docker...\n"
	@docker compose -f $(DOCKER_COMPOSE_FILE) down || true
	@docker ps -aq | xargs -r docker rm -f
	@docker system prune --all --force --volumes
	@docker network prune --force
	@docker volume prune --force
	@docker images -q --filter "reference=$(name)*" | xargs -r docker rmi -f

	@printf "🧹 Exclua a pasta /goinfre/$(USER)/ft_transcendence manualmente!.\n"
	@printf "✅ Todos os arquivos foram removidos com sucesso.\n"

# -----------------------------------------------------------------------------
# 5) Alvo para rodar migrations (caso precise depois de subir)
# -----------------------------------------------------------------------------
migrate:
	@docker compose -f $(DOCKER_COMPOSE_FILE) exec -it web python manage.py migrate

.PHONY: setup up down re clean fclean migrate

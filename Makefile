name = ft_transcendence

# Caminhos do projeto – valor padrão
PROJECT_PATH ?= $(HOME)/ft_transcendence

# Caso você use apenas UM docker-compose.yml para dev e outro para prod,
# defina aqui (ou mude conforme sua estrutura):
DOCKER_COMPOSE_DEV_FILE = $(PROJECT_PATH)/docker-compose.dev.yml
DOCKER_COMPOSE_PROD_FILE = $(PROJECT_PATH)/docker-compose.prod.yml

# Tenta criar /goinfre/$(USER); se não for possível, utiliza ~/goinfre/$(USER)
GOINFRE_BASE := /goinfre/$(USER)
GOINFRE_PATH := $(shell if mkdir -p $(GOINFRE_BASE) 2>/dev/null; then echo $(GOINFRE_BASE)/$(name); else echo $(HOME)/goinfre/$(USER)/$(name); fi)

POSTGRES_PATH = $(GOINFRE_PATH)/postgres_data
REDIS_PATH = $(GOINFRE_PATH)/redis_data
DJANGO_APP_PATH = $(GOINFRE_PATH)/django_app
STATICFILES_PATH = $(GOINFRE_PATH)/staticfiles
MEDIA_PATH = $(GOINFRE_PATH)/media
REACT_APP_PATH = $(GOINFRE_PATH)/react_app

#
# Pergunta sobre o path do projeto APENAS no 'make setup'
#
setup:
	@printf "🔄 Executando setup.sh...\n"
	@chmod +x ./setup.sh
	@./setup.sh
	@read -p "Informe o path onde você baixou o projeto (ENTER para usar $(HOME)/ft_transcendence): " proj; \
	if [ -z "$$proj" ]; then \
	  proj="$(HOME)/ft_transcendence"; \
	fi; \
	echo "Utilizando o path: $$proj"; \
	echo; \
	echo "Agora execute 'make development' ou 'make production' conforme desejar."; \
	echo "Exemplo: make development PROJECT_PATH=$$proj"; \
	echo

clear-db:
	@printf "🗑️  Limpando tabelas do banco de dados...\n"
	@test -x ./clear_db.sh || chmod +x ./clear_db.sh
	@./clear_db.sh

# Criação de diretórios necessários para persistência dos dados
create_dirs:
	@printf "🔧 Criando diretórios para persistência dos dados...\n"
	@mkdir -p $(POSTGRES_PATH) $(REDIS_PATH) $(DJANGO_APP_PATH) $(STATICFILES_PATH) $(MEDIA_PATH) $(REACT_APP_PATH)
	@printf "✅ Diretórios criados com sucesso em $(GOINFRE_PATH)\n"

#
# Modo DESENVOLVIMENTO
# Usa um docker-compose (ou alvo do Dockerfile) que tenha hot reload etc.
#
development: create_dirs
	@printf "🚀 Iniciando em modo DEVELOPMENT...\n"
	@docker compose -f $(DOCKER_COMPOSE_DEV_FILE) up -d --build
	@docker compose -f $(DOCKER_COMPOSE_DEV_FILE) exec -it web python manage.py migrate

#
# Modo PRODUÇÃO
# Usa outro docker-compose (ou outro alvo do Dockerfile) com build otimizado.
#
production: create_dirs
	@printf "🚀 Iniciando em modo PRODUCTION...\n"
	@docker compose -f $(DOCKER_COMPOSE_PROD_FILE) up -d --build
	@docker compose -f $(DOCKER_COMPOSE_PROD_FILE) exec -it web python manage.py migrate

#
# Construção (caso ainda queira usar com o arquivo principal, se existir)
#
build: create_dirs
	@printf "🏗️  Construindo configuração $(name)...\n"
	@docker compose -f $(PROJECT_PATH)/docker-compose.yml up -d --build

#
# Parada dos containers (padrão)
#
down:
	@printf "🛑 Parando configuração $(name)...\n"
	@docker compose -f $(PROJECT_PATH)/docker-compose.yml down || true
	@docker compose -f $(DOCKER_COMPOSE_DEV_FILE) down || true
	@docker compose -f $(DOCKER_COMPOSE_PROD_FILE) down || true

#
# Reinicialização completa (limpa tudo e recria)
#
re: fclean development
	@printf "🔄 Reinicialização completa para $(name) em modo DEV...\n"

#
# Limpeza parcial (containers + volumes)
#
clean: down
	@printf "🧹 Limpando configuração $(name)...\n"
	@docker system prune -a --volumes --force
	@sudo rm -rf $(POSTGRES_PATH)/*
	@sudo rm -rf $(REDIS_PATH)/*
	@sudo rm -rf $(REACT_APP_PATH)/*
	@sudo rm -rf $(PROJECT_PATH)/client-pong/node_modules

#
# Limpeza total (tudo, incluindo imagens Docker e volumes)
#
fclean:
	@printf "🔥 Limpeza total de todas as configurações do Docker...\n"
	@docker compose down || true
	@docker ps -aq | xargs -r docker rm -f
	@docker system prune --all --force --volumes
	@docker network prune --force
	@docker volume prune --force
	@docker images -q --filter "reference=$(name)*" | xargs -r docker rmi -f
	@sudo rm -rf $(PROJECT_PATH)/client-pong/node_modules
	@sudo rm -rf $(GOINFRE_PATH)/*
	@printf "✅ Todos os arquivos foram removidos com sucesso.\n"

.PHONY: setup clear-db create_dirs development production build down re clean fclean

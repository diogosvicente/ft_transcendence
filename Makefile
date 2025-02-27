name = ft_transcendence

# Caminhos do projeto
PROJECT_PATH = $(HOME)/ft_transcendence
DOCKER_COMPOSE_FILE = $(PROJECT_PATH)/docker-compose.yml

# Caminhos para os volumes armazenados no /goinfre/$USER
GOINFRE_PATH = /goinfre/$(USER)/$(name)
POSTGRES_PATH = $(GOINFRE_PATH)/postgres_data
REDIS_PATH = $(GOINFRE_PATH)/redis_data
DJANGO_APP_PATH = $(GOINFRE_PATH)/django_app
STATICFILES_PATH = $(GOINFRE_PATH)/staticfiles
MEDIA_PATH = $(GOINFRE_PATH)/media
REACT_APP_PATH = $(GOINFRE_PATH)/react_app

setup:
	@printf "🔄 Executando setup.sh...\n"
	@chmod +x ./setup.sh
	@./setup.sh

clear-db:
	@printf "🗑️  Limpando tabelas do banco de dados...\n"
	@test -x ./clear_db.sh || chmod +x ./clear_db.sh
	@./clear_db.sh

# Criação de diretórios necessários
create_dirs:
	@printf "🔧 Criando diretórios para persistência dos dados...\n"
	@mkdir -p $(POSTGRES_PATH) $(REDIS_PATH) $(DJANGO_APP_PATH) $(STATICFILES_PATH) $(MEDIA_PATH) $(REACT_APP_PATH)
	@printf "✅ Diretórios criados com sucesso em $(GOINFRE_PATH)\n"

# Inicialização completa do projeto
all: create_dirs
	@printf "🚀 Iniciando configuração ${name}...\n"
	@docker compose -f $(DOCKER_COMPOSE_FILE) up -d
	@docker compose exec -it web python manage.py migrate

# Construção do projeto
build: create_dirs
	@printf "🏗️  Construindo configuração ${name}...\n"
	@docker compose -f $(DOCKER_COMPOSE_FILE) up -d --build

# Parada dos containers
down:
	@printf "🛑 Parando configuração ${name}...\n"
	@docker compose -f $(DOCKER_COMPOSE_FILE) down

# Reinicialização completa (limpa tudo e recria)
re: fclean all
	@printf "🔄 Reinicialização completa para ${name}...\n"

# Limpeza parcial (containers + volumes)
clean: down
	@printf "🧹 Limpando configuração ${name}...\n"
	@docker system prune -a --volumes --force
	@sudo rm -rf $(GOINFRE_PATH)/postgres_data/*
	@sudo rm -rf $(GOINFRE_PATH)/redis_data/*
	@sudo rm -rf $(GOINFRE_PATH)/react_app/*
	@sudo rm -rf $(PROJECT_PATH)/client-pong/node_modules

# Limpeza total (tudo, incluindo imagens Docker e volumes)
fclean:
	@printf "🔥 Limpeza total de todas as configurações do Docker...\n"
	@docker compose down
	@docker ps -aq | xargs -r docker rm -f
	@docker system prune --all --force --volumes
	@docker network prune --force
	@docker volume prune --force
	@docker images -q --filter "reference=$(name)*" | xargs -r docker rmi -f
	@sudo rm -rf $(PROJECT_PATH)/client-pong/node_modules
	@sudo rm -rf $(GOINFRE_PATH)/*
	@printf "✅ Todos os arquivos foram removidos com sucesso.\n"

.PHONY: all build down re clean fclean create_dirs setp

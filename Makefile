name = ft_transcendence

# Caminhos atualizados para o seu projeto
PROJECT_PATH = ~/Documents/ft_transcendence
DOCKER_COMPOSE_FILE = $(PROJECT_PATH)/docker-compose.yml
ENV_FILE = $(PROJECT_PATH)/.env

all:
	@printf "Launching configuration ${name}...\n"
	@docker compose -f $(DOCKER_COMPOSE_FILE) --env-file $(ENV_FILE) up -d
	@docker compose exec -it web python manage.py migrate

build:
	@printf "Building configuration ${name}...\n"
	@docker compose -f $(DOCKER_COMPOSE_FILE) --env-file $(ENV_FILE) up -d --build

down:
	@printf "Stopping configuration ${name}...\n"
	@docker compose -f $(DOCKER_COMPOSE_FILE) --env-file $(ENV_FILE) down

# O comando 're' agora faz 'fclean' e depois 'all'
re: fclean all
	@printf "Rebuild complete for ${name}...\n"

clean: down
	@printf "Cleaning configuration ${name}...\n"
	@docker system prune -a --volumes --force
	@rm -rf $(PROJECT_PATH)/client-pong/node_modules
	@rm -rf /goinfre/$(USER)/postgres_data/*
	@rm -rf /goinfre/$(USER)/redis_data/*

fclean:
	@printf "Total clean of all Docker configurations...\n"
	@docker compose down  # Certifique-se de parar os containers antes de removê-los
	@docker ps -aq | xargs -r docker rm -f  # Remove todos os containers, se houver
	@docker system prune --all --force --volumes
	@docker network prune --force
	@docker volume prune --force
	@docker images -q --filter "reference=ft_transcendence*" | xargs -r docker rmi -f  # Remove apenas as imagens associadas ao seu projeto
	@rm -rf $(PROJECT_PATH)/client-pong/node_modules

.PHONY: all build down re clean fclean

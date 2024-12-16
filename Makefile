NAME 				= pong
ENV_FILE			= .env

all: up

up:
	@printf "Launch configuration ${NAME}...\n"
	@docker-compose -f ./docker-compose.yml --env-file ${ENV_FILE} up -d
	@open http://localhost:5173

build:
	@printf "Building configuration ${NAME}...\n"
	@docker-compose -f ./docker-compose.yml --env-file ${ENV_FILE} up -d --build

down:
	@printf "Stopping configuration ${NAME}...\n"
	@docker-compose -f ./docker-compose.yml --env-file ${ENV_FILE} down

re:
	@printf "Rebuild configuration ${NAME}...\n"
	@docker-compose -f ./docker-compose.yml --env-file ${ENV_FILE} up -d --build

clean: down
	@printf "Cleaning configuration ${NAME}...\n"
	@docker system prune -a


#Be careful! Fclean removes all Docker images that are on the machine!
fclean:
	@printf "Total clean of all configurations docker\n"
	@docker stop $$(docker ps -qa)
	@docker system prune --all --force --volumes
	@docker network prune --force
	@docker volume prune --force
	@docker rm -f $(docker ps -a -q)
	@docker volume rm $(docker volume ls -q)

.PHONY	: all build down re clean fclean

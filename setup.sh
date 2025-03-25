#!/bin/bash

# 1) Ler IP do usuário
read -p "Digite o IP para o servidor (ex: 192.168.1.138): " IP_ADDRESS
export IP_ADDRESS

# 2) Tenta criar /goinfre/$USER com sudo; se falhar, cria ~/goinfre
TARGET_DIR="/goinfre/$USER"
export VOLUME_BASE_PATH="$TARGET_DIR/ft_transcendence"

# 3) Define a subpasta 'ft_transcendence' e exporta como VOLUME_BASE_PATH
export VOLUME_BASE_PATH="$TARGET_DIR/ft_transcendence"
echo "Pasta de volumes definida em: $VOLUME_BASE_PATH"

# 3.1) Cria subpastas necessárias para volumes (redis_data, postgres_data, etc.)
echo "Criando subpastas de volumes em $VOLUME_BASE_PATH..."
mkdir -p "$VOLUME_BASE_PATH/redis_data" \
         "$VOLUME_BASE_PATH/postgres_data" \
         "$VOLUME_BASE_PATH/django_app" \
         "$VOLUME_BASE_PATH/staticfiles" \
         "$VOLUME_BASE_PATH/media"

chmod -R 775 "$VOLUME_BASE_PATH"
chown -R "$USER" "$VOLUME_BASE_PATH"

# 4) Define PROJECT_PATH usando pwd
export PROJECT_PATH="$(pwd)"
echo "Project path: $PROJECT_PATH"

# 5) Gera .env a partir do template (substitui todas as variáveis)
echo "Gerando .env a partir de .env.template..."
envsubst < templates/env.template > .env

# 6) Gera nginx.conf (substitui somente $IP_ADDRESS)
echo "Gerando nginx.conf a partir de nginx.conf.template..."
envsubst '$IP_ADDRESS' < templates/nginx.conf.template > nginx.conf

# 7) Gera config.js (substitui $IP_ADDRESS)
echo "Gerando config.js a partir de config.js.template..."
envsubst '$IP_ADDRESS' < templates/config.js.template > server-pong/client_pong/static/client_pong/js/config.js

# 8) Gera docker-compose.yml (substitui $VOLUME_BASE_PATH, $PROJECT_PATH e $IP_ADDRESS)
#    Necessário ter um docker-compose.yml.template com $VOLUME_BASE_PATH e $PROJECT_PATH
echo "Gerando docker-compose.yml a partir de docker-compose.yml.template..."
envsubst '$VOLUME_BASE_PATH $PROJECT_PATH $IP_ADDRESS' < templates/docker-compose.yml.template > docker-compose.yml

# 9) Gera certificado autoassinado para $IP_ADDRESS
echo "Gerando certificado autoassinado para $IP_ADDRESS..."
openssl req -x509 -newkey rsa:4096 -days 365 -nodes \
  -keyout server-pong/certs/key.pem -out server-pong/certs/cert.pem \
  -subj "/CN=$IP_ADDRESS" \
  -addext "subjectAltName=IP:$IP_ADDRESS"

echo
echo "Setup finalizado com sucesso! Confira os arquivos gerados:"
echo " - .env"
echo " - nginx.conf"
echo " - client-pong/src/assets/config/config.js"
echo " - docker-compose.yml"
echo " - server-pong/certs/key.pem e cert.pem"

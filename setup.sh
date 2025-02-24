#!/bin/bash

# 1) Ler IP do usuário
read -p "Digite o IP para o servidor (ex: 192.168.1.138): " IP_ADDRESS

# 2) Exportar a variável para o envsubst
export IP_ADDRESS=$IP_ADDRESS

# 3) Gera .env a partir do template (substitui todas as variáveis)
echo "Gerando .env a partir de .env.template..."
envsubst < templates/env.template > .env

# 4) Gera nginx.conf (substitui **somente** ${IP_ADDRESS})
echo "Gerando nginx.conf a partir de nginx.conf.template..."
envsubst '$IP_ADDRESS' < templates/nginx.conf.template > nginx.conf

# 5) Gera vite.config.js (substitui todas as variáveis)
echo "Gerando vite.config.js a partir de vite.config.js.template..."
envsubst < templates/vite.config.js.template > client-pong/vite.config.js

# 6) Gera config.js (substitui todas as variáveis)
echo "Gerando config.js a partir de config.js.template..."
envsubst '$IP_ADDRESS' < templates/config.js.template > client-pong/src/assets/config/config.js

# 7) Gera certificado autoassinado
echo "Gerando certificado autoassinado para $IP_ADDRESS..."
openssl req -x509 -newkey rsa:4096 -days 365 -nodes \
  -keyout server-pong/certs/key.pem -out server-pong/certs/cert.pem \
  -subj "/CN=$IP_ADDRESS" \
  -addext "subjectAltName=IP:$IP_ADDRESS"

echo
echo "Setup finalizado com sucesso! Confira os arquivos gerados:"
echo " - .env"
echo " - nginx.conf"
echo " - client-pong/vite.config.js"
echo " - client-pong/src/assets/config/config.js"
echo " - server-pong/certs/key.pem e cert.pem"

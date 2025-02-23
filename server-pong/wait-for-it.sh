#!/bin/sh
# Script para aguardar o banco de dados antes de iniciar o Django.

HOST="$1"
PORT="$2"
shift 2
CMD="$@"

echo "⏳ Aguardando o banco de dados em $HOST:$PORT..."

while ! nc -z "$HOST" "$PORT"; do
  sleep 1
done

echo "✅ Banco de dados está pronto! Iniciando Django..."
exec $CMD

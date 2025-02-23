FROM python:3.12-alpine

# Definições de ambiente
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Instala dependências
RUN apk update && apk add postgresql-dev gcc python3-dev musl-dev

COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . .

# Copia e adiciona permissão ao script de espera
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

CMD ["/wait-for-it.sh", "db", "5432", "--", "daphne", "-b", "0.0.0.0", "-p", "8000", "setup.asgi:application"]

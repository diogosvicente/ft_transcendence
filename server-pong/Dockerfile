# ---------------------------------------------
# Estágio BASE (comum a dev e prod)
# ---------------------------------------------
    FROM python:3.12-alpine AS base

    # Definições de ambiente
    ENV PYTHONDONTWRITEBYTECODE 1
    ENV PYTHONUNBUFFERED 1
    
    WORKDIR /app
    
    # Instala dependências do sistema
    RUN apk update && apk add --no-cache postgresql-dev gcc python3-dev musl-dev
    
    # Instala dependências Python
    COPY requirements.txt .
    RUN pip install --upgrade pip
    RUN pip install --no-cache-dir -r requirements.txt
    
    # Copia todo o código
    COPY . .
    
    # Copia e adiciona permissão ao script de espera
    COPY wait-for-it.sh /wait-for-it.sh
    RUN chmod +x /wait-for-it.sh
    
    # ---------------------------------------------
    # Estágio de DESENVOLVIMENTO
    # ---------------------------------------------
    FROM base AS development
    
    # Em desenvolvimento, normalmente usamos runserver (hot reload)
    CMD ["/wait-for-it.sh", "db", "5432", "--", "python", "manage.py", "runserver", "0.0.0.0:8000"]
    
    # ---------------------------------------------
    # Estágio de PRODUÇÃO
    # ---------------------------------------------
    FROM base AS production
    
    # Se necessário, faça coletar arquivos estáticos (caso use collectstatic)
    # RUN python manage.py collectstatic --noinput
    
    # Em produção, geralmente usamos um servidor mais robusto, como o Daphne, Gunicorn ou Uvicorn
    CMD ["/wait-for-it.sh", "db", "5432", "--", "daphne", "-b", "0.0.0.0", "-p", "8000", "setup.asgi:application"]
    
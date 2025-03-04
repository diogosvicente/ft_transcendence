# ----------------------------
# Estágio de DESENVOLVIMENTO
# ----------------------------
    FROM node:22.12-alpine as development

    WORKDIR /app
    
    # Copia apenas os arquivos de dependências para instalar primeiro
    COPY package.json package-lock.json ./
    
    RUN npm install
    
    # Copia o restante do código
    COPY . .
    
    # Comando para rodar em modo de desenvolvimento (hot reload)
    CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
    
    # ----------------------------
    # Estágio de PRODUÇÃO
    # ----------------------------
    FROM node:22.12-alpine as production
    
    WORKDIR /app
    
    # Copia novamente as dependências para instalar
    COPY package.json package-lock.json ./
    
    RUN npm install
    
    # Copia o restante do código
    COPY . .
    
    # Faz o build dos arquivos estáticos
    RUN npm run build
    
    # Expõe a porta 80 (opcional se quiser rodar em outra porta)
    EXPOSE 80
    
    # Usa 'serve' para disponibilizar a pasta dist em modo de produção
    CMD ["npx", "serve", "dist", "--listen", "80"]
    
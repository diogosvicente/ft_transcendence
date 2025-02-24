# ft_transcendence

## 🚀 Sobre o Projeto

Este projeto roda em **rede local**, permitindo que múltiplos usuários se conectem sem depender de serviços externos.

⚠️ **Antes de iniciar, rode `make setup` para configurar o IP da máquina servidora.**

Diferente de aplicações tradicionais que rodam em `https://localhost:PORTA`, este projeto estará disponível em:

🔗 **`https://IP_MAQUINA_SERVIDORA`**

## 🛠️ Tecnologias Utilizadas

- 🐍 **Django** (Backend)
- ⚛️ **React JS** (Frontend)
- 🐘 **PostgreSQL** (Banco de Dados)
- 🔄 **Redis** (Gerenciamento de WebSockets)
- 🐳 **Docker & Docker Compose** (Orquestração de Contêineres)
- 🔧 **Nginx** (Proxy Reverso)

---

## 📌 Como Usar

### 🔄 Executando o Setup Inicial

```bash
make setup
```

Este comando configura o ambiente e define corretamente o IP da máquina servidora.

### 🚀 Iniciando os Contêineres

```bash
make all
```

Acesse o app via **`https://IP_MAQUINA_SERVIDORA`**

### 🏗️ Construindo a Aplicação

```bash
make build
```

### 🛑 Parando os Contêineres

```bash
make down
```

### 🔄 Reinicializando o Ambiente

```bash
make re
```

### 🧹 Limpando os Contêineres e Volumes

```bash
make clean
```

### 🔥 Resetando Tudo (inclusive imagens Docker e volumes)

```bash
make fclean
```

### 🗑️ Limpando as Tabelas do Banco de Dados

```bash
make clear-db
```

---

## 🧐 Logs e Debugging

Para visualizar os logs de cada serviço:

📜 **Backend (Django + Daphne):**
```bash
docker compose logs -f web
```

📜 **Banco de Dados (PostgreSQL):**
```bash
docker compose logs -f db
```

📜 **Frontend (React JS):**
```bash
docker compose logs -f frontend
```

📜 **Nginx (Proxy Reverso):**
```bash
docker compose logs -f nginx
```

📜 **Redis (Gerenciamento de WebSockets):**
```bash
docker compose logs -f redis
```

---

## 📌 Observações
- **O acesso ao aplicativo deve ser feito via `https://IP_MAQUINA_SERVIDORA` e não `localhost`.**
- **Certifique-se de que o firewall permite conexões na porta 443.**
- **Os logs são úteis para verificar possíveis erros na comunicação entre os serviços.**

---

✅ **Tudo pronto! Agora é só começar a usar!** 🎮


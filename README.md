# ft_transcendence

## 🚀 Sobre o Projeto

Este projeto roda em **rede local**, permitindo que múltiplos usuários se conectem sem depender de serviços externos.

⚠️ **Antes de iniciar, rode `make setup` para configurar o IP da máquina servidora** e criar as pastas de volumes em `/goinfre/$USER` ou `~/goinfre`.

Diferente de aplicações tradicionais que rodam em `https://localhost:PORTA`, este projeto estará disponível em:

🔗 **`https://IP_DA_SUA_MAQUINA:4443`** ou  
🔗 **`http://IP_DA_SUA_MAQUINA:8080`**

## 🛠️ Tecnologias Utilizadas

- 🐍 **Django** (Backend)
- ⚫️ **Javascript Vanilla + Boostrap** (Frontend)
- 🐓 **PostgreSQL** (Banco de Dados)
- 🔄 **Redis** (Gerenciamento de WebSockets)
- 🐳 **Docker & Docker Compose** (Orquestração de Contêineres)
- 🔧 **Nginx** (Proxy Reverso)

---

## 📌 Como Usar

### 🔄 Executando o Setup Inicial

```bash
make setup
```

- Pergunta o IP da máquina servidora.
- Cria pasta de volumes em `/goinfre/$USER/ft_transcendence`
- Gera `docker-compose.yml`, `.env`, `nginx.conf`, certificados etc.

### 🚀 Iniciando os Contêineres

```bash
make up
```

- Sobe todos os serviços (Django, Nginx, Postgres, Redis).
- Executa `python manage.py migrate` ao final.
- Acesse o app via **`https://IP_DA_SUA_MAQUINA:4443`** ou **`http://IP_DA_SUA_MAQUINA:8080`**.

### 🏰 Parando os Contêineres

```bash
make down
```

- Para todos os contêineres que estão rodando.

### 🔄 Reinicializando o Ambiente

```bash
make re
```

- Faz `fclean` (remove tudo) e depois `make up` para reiniciar do zero.

### 🧹 Limpando os Contêineres e Volumes

```bash
make clean
```

- Remove containers parados e faz um `docker system prune -a --volumes --force` (não apaga a pasta local).

### 🔥 Resetando Tudo (inclusive a pasta local de volumes)

```bash
make fclean
```

- Remove containers, imagens, volumes e **também** a pasta `/goinfre/$USER/ft_transcendence` (ou `~/goinfre/ft_transcendence`).

### 🗑️ Limpando as Tabelas do Banco de Dados

```bash
make migrate
```

- Executa `python manage.py migrate` dentro do container `web`.

---

## WSL: Expondo Portas para a Rede Local

Se estiver usando **WSL2** no Windows e quiser que outras máquinas acessem a aplicação (porta 4443 e 8080), faça:

1. No **WSL**, descubra o IP local rodando:
   ```bash
   hostname -I
   ```
   Exemplo de saída: `172.23.131.177 ...`

2. No **PowerShell** (como Administrador) no Windows, crie as regras de redirecionamento:
   ```powershell
   netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=4443 connectaddress=172.23.131.177 connectport=4443
   netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=8080 connectaddress=172.23.131.177 connectport=8080
   ```
   (Substitua `172.23.131.177` pelo IP do seu WSL.)

3. Verifique se o **Firewall do Windows** está liberando conexões nessas portas.

Dessa forma, você pode acessar de outra máquina via `https://SEU_IP_WINDOWS:4443` ou `http://SEU_IP_WINDOWS:8080`.

---

## 🤔 Logs e Debugging

Para visualizar os logs de cada serviço:

- **Backend (Django + Daphne)**:
  ```bash
  docker compose logs -f web
  ```
- **Banco de Dados (PostgreSQL)**:
  ```bash
  docker compose logs -f db
  ```
- **Nginx (Proxy Reverso)**:
  ```bash
  docker compose logs -f nginx
  ```
- **Redis (Gerenciamento de WebSockets)**:
  ```bash
  docker compose logs -f redis
  ```

---

## 📌 Observações

- **Acesse sempre via** `https://IP_DA_SUA_MAQUINA:4443` ou `http://IP_DA_SUA_MAQUINA:8080`.
- **Certifique-se** de que o firewall permite conexões nessas portas.
- **make fclean** apaga completamente containers, imagens e a pasta local de volumes (`/goinfre/$USER/ft_transcendence`).

💪 **Tudo pronto!** Agora é só começar a usar! 🎮

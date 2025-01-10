# Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Instalação](#2-instalação)
3. [Uso](#3-uso)
---

## 1. Pré-requisitos

- Python 3.x
- venv
- PostgreSQL
- Docker (chat)
---

## 2. Instalação

### 2.1. Clonando o Repositório

Clone o repositório para o seu ambiente local:
```bash
git clone --branch dev git@github.com:diogosvicente/ft_transcendence.git
```

### 2.2. Navegando até o Diretório do Backend

Entre no diretório correspondente ao backend do projeto:
```bash
cd ft_transcendence/server-pong
```

### 2.3. Criando um Ambiente Virtual

Crie um ambiente virtual para isolar as dependências:
```bash
python -m venv venv
```

Ative o ambiente virtual:
- **Windows**:
```bash
venv\Scripts\activate
```
- **Linux/MacOS**:
```bash
source venv/bin/activate
```

### 2.4. Criando o .env

Crie uma cópia do .env.example para configurar as variáveis de ambiente:
```bash
cp .env.example .env
```

Configure os valores necessários no arquivo `.env`, como:
- A chave secreta do Django.
- Variáveis de conexão com o banco de dados PostgreSQL.

**Use o seguinte comando para gerar uma chave secreta do django para uso local.**
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### 2.5. Configurando o PostgreSQL

- **Windows**:
   Caso esteja utilizando Windows, faça o download do PostgreSQL e do PgAdmin através do site oficial:
   [postgreSQL](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
   1. Abra o PgAdmin após a instalação.
   2. Crie um **servidor** com o nome `ft_transcendence`.
   3. Dentro deste servidor, crie um **database** também chamado `ft_transcendence`.

- **Ubuntu**:
   ```bash
   apt install postgresql
   ```
   Acessando o cliente do postgreSQL(psql) para criar o banco de dados:
   ```bash
   sudo -u postgres psql
   ```
   `CREATE DATABASE ft_transcendence`;

   Altere a senha do usuário 'postgres'
  ```bash
   ALTER USER postgres WITH PASSWORD 'nova_senha';
  ```

   *Você pode verificar se o db foi criado com o comando `\l`*
   *Para sair do psql use o comando `\q`*

Certifique-se de que o arquivo `.env` contém as credenciais corretas para se conectar ao banco de dados configurado:
- Nome do banco: `ft_transcendence`.
- Usuário e senha definidos no PgAdmin.

**Para uma explicação visual e detalhada sobre como configurar o PostgreSQL e o PgAdmin, assista ao vídeo abaixo:
[Como configurar o PostgreSQL e PgAdmin](https://www.youtube.com/watch?v=UbX-2Xud1JA&t=128s).**

### 2.6. Instalando as dependências

Com o ambiente virtual ativo, instale as dependências necessárias:
```bash
python -m pip install -r requirements.txt
```

**Sempre que instalar novas depedências use o comando abaixo para atualizar
o arquivo `requirements.txt` para que os outros devs possam ter acesso
ao ambiente atualizado.**

```bash
pip freeze > requirements.txt
```
---

## 3. Uso

### 3.1. Aplicando as Migrations do Banco de Dados

Aplique as migrações (necessário apenas quando houver novas mudanças no banco):
```bash
python manage.py migrate
```

### 3.2. Inicie o Servidor

Execute o servidor de desenvolvimento:
```bash
python manage.py runserver
```

### 3.3. Acesse o Projeto

Abra o navegador e acesse o projeto em:
[http://127.0.0.1:8000](http://127.0.0.1:8000)

### 3.4. Utilizando o Redis (opcional caso não utilize o chat)

```bash
docker run --rm -p 6379:6379 redis:7
```
---

## 4. Funcionalidades

### 4.1. Gerenciamento de usuários

### 4.2. Chat

## 5. Estrutura do Projeto

- **backend/**: Contém todo o código do backend utilizando Django.
- **venv/**: Ambiente virtual onde as dependências do projeto estão instaladas.
- **.env**: Arquivo de variáveis de ambiente.
---

Agora você está pronto para usar e explorar o projeto! 🎉

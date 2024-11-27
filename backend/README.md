
# Guia de Configuração do Projeto

## 1. Passos para Configuração

### 1.1. Faça o download do projeto
Clone este repositório para o seu ambiente local:
```bash
git clone --branch dev git@github.com:diogosvicente/ft_transcendence.git
```

### 1.2. Navegue até o diretório do backend
Entre no diretório correspondente ao backend do projeto:
```bash
cd ft_transcendence/backend
```

### 1.3. Crie um ambiente virtual isolado
1. Execute o comando abaixo para criar um ambiente virtual:
   ```bash
   python -m venv venv
   ```
2. Ative o ambiente virtual:
   - **Windows**:
     ```bash
     venv\Scripts\activate
     ```
   - **Linux/MacOS**:
     ```bash
     source venv/bin/activate
     ```

### 1.4. Crie o arquivo `.env` a partir do template `.env.example`
1. Crie uma cópia do arquivo `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Configure os valores necessários no arquivo `.env`, como:
   - A chave secreta do Django.
   - Variáveis de conexão com o banco de dados PostgreSQL.

---

## 2. Configurando o PostgreSQL

### 2.1. Instale o PostgreSQL
Caso esteja utilizando Windows, faça o download do PostgreSQL e do PgAdmin através do site oficial:  
https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

### 2.2. Configure o Banco de Dados
1. Abra o PgAdmin após a instalação.
2. Crie um **servidor** com o nome `ft_transcendence`.
3. Dentro deste servidor, crie um **database** também chamado `ft_transcendence`.

### 2.3. Atualize o Arquivo `.env`
Certifique-se de que o arquivo `.env` contém as credenciais corretas para se conectar ao banco de dados configurado:
- Nome do banco: `ft_transcendence`.
- Usuário e senha definidos no PgAdmin.

### 2.4. Referência Detalhada
Para uma explicação visual e detalhada sobre como configurar o PostgreSQL e o PgAdmin, assista ao vídeo abaixo:  
[Como configurar o PostgreSQL e PgAdmin](https://www.youtube.com/watch?v=UbX-2Xud1JA&t=128s).

---

## 3. Instale as Dependências

### 3.1. Instale as dependências do projeto
Com o ambiente virtual ativo, instale as dependências necessárias:
```bash
python -m pip install -r requirements.txt
```

### Sobre as dependências instaladas
Sempre que instalar alguma depedência, use o comando abaixo, após instalar alguma dependência para incluí-la no arquivo `requirements.txt` para uso futuro, este comando permite que todos  tenham todas as dependências do projeto:
```bash
python pip freeze > requirements.txt
```

---

## 4. Executando o Projeto

### 4.1. Configure o Banco de Dados
1. Aplique as migrações:
   ```bash
   python manage.py migrate
   ```

### 4.2. Inicie o Servidor
Execute o servidor de desenvolvimento:
```bash
python manage.py runserver
```

### 4.3. Acesse o Projeto
Abra o navegador e acesse o projeto em:  
[http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 5. Utilizando o Redis

O Redis gerencia a comunicação entre diferentes usuários e servidores. Para configurá-lo, execute o comando abaixo:

```bash
docker run --rm -p 6379:6379 redis:7
```

---

## 6. Estrutura do Projeto

- **backend/**: Contém todo o código do backend utilizando Django.
- **venv/**: Ambiente virtual onde as dependências do projeto estão instaladas.
- **.env**: Arquivo de variáveis de ambiente.

---

Agora você está pronto para usar e explorar o projeto! 🎉

## Passos para Configuração

### 1. Faça o download do projeto
Clone este repositório para o seu ambiente local:
```bash
git clone --branch dev git@github.com:diogosvicente/ft_transcendence.git
```

### 2. Navegue até o diretório do backend
Entre no diretório correspondente ao backend do projeto:
```bash
cd ft_transcendence/backend
```

### 3. Crie um ambiente virtual isolado
Execute o comando abaixo para criar um ambiente virtual:
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

### 4. Crie o arquivo .env a partir do template .env.example
Crie uma cópia do .env.example e altere o arquivo com os valores da sua chave
secreta gerada localmente e senha do postgreSQL.
```bash
cp .env.example .env
```
> Certifique-se de configurar os valores necessários no arquivo `.env`, como a secret key do django e as variáveis de conexão com o banco de dados.

### 5. Instale as dependências
Com o ambiente virtual ativo, instale as dependências necessárias para o projeto com o seguinte comando:
```bash
python -m pip install -r requirements.txt

```

### 6. Gere o arquivo de requisitos
Salve as dependências instaladas no arquivo `requirements.txt` para uso futuro:
```bash
python -m pip freeze > requirements.txt
```

---

## Executando o Projeto
Após configurar o ambiente, você pode iniciar o servidor de desenvolvimento:
1. Aplique as migrações para configurar o banco de dados:
   ```bash
   python manage.py migrate
   ```
2. Inicie o servidor:
   ```bash
   python manage.py runserver
   ```
3. Acesse o projeto no navegador em: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## Utilizando o Redis
O Redis é um mensageiro que gerencia a comunicação
entre diferentes usuários e servidores
```bash
docker run --rm -p 6379:6379 redis:7
```

## Estrutura do Projeto
- **backend/**: Contém todo o código do backend utilizando Django.
- **venv/**: Ambiente virtual onde as dependências do projeto estão instaladas.
- **.env**: Arquivo de variáveis de ambiente.

---

## Configurando o PostgreSQL

1. **Instale o PostgreSQL**:
   Caso esteja utilizando Windows, faça o download do PostgreSQL e do PgAdmin através do site oficial:  
   https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Configure o Banco de Dados**:
   - Abra o PgAdmin após a instalação.
   - Crie um **servidor** com o nome `ft_transcendence`.
   - Dentro deste servidor, crie um **database** também chamado `ft_transcendence`.

3. **Atualize o Arquivo `.env`**:
   - Certifique-se de que o arquivo `.env` contém as credenciais corretas para se conectar ao banco de dados que você configurou:
     - Nome do banco: `ft_transcendence`.
     - Usuário e senha conforme definidos no PgAdmin.

4. **Referência Detalhada**:
   Para uma explicação visual e detalhada sobre como configurar o PostgreSQL e o PgAdmin, assista ao vídeo abaixo:  
   [Como configurar o PostgreSQL e PgAdmin](https://www.youtube.com/watch?v=UbX-2Xud1JA&t=128s).

---

Agora você está pronto para usar e explorar o projeto! 🎉

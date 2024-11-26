
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
Com o ambiente virtual ativo, instale as dependências necessárias para o projeto com os seguintes comandos:
```bash
pip install django
python.exe -m pip install --upgrade pip
pip install djangorestframework
pip install markdown
pip install Pillow
pip install python-dotenv
pip install psycopg2
pip install psycopg2-binary
```

### 6. Gere o arquivo de requisitos
Salve as dependências instaladas no arquivo `requirements.txt` para uso futuro:
```bash
pip freeze > requirements.txt
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

## Estrutura do Projeto
- **backend/**: Contém todo o código do backend utilizando Django.
- **venv/**: Ambiente virtual onde as dependências do projeto estão instaladas.
- **.env**: Arquivo de variáveis de ambiente.

---

Agora você está pronto para usar e explorar o projeto! 🎉

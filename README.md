# 🚀 ft_transcendence - Makefile

Este **Makefile** automatiza a execução, limpeza e configuração do ambiente **ft_transcendence**.

## 📌 Índice

- [🟢 Starting containers](#starting-containers)
- [🛑 Stopping containers](#stopping-containers)
- [🔄 Restarting containers](#restarting-containers)
- [🗑 Cleaning up](#cleaning-up)
- [🔥 Full cleanup](#full-cleanup)
- [📂 Creating directories](#creating-directories)
- [🔄 Running setup script](#running-setup-script)
- [🗑 Clearing database tables](#clearing-database-tables)

---

## 🟢 Starting containers

```bash
make all
```

- Cria os diretórios necessários em `/goinfre/$USER`
- Inicia os containers do **Docker Compose**
- Executa as migrações do banco de dados

Acesse o app em **[https://localhost:3000](https://localhost:3000)**.

---

## 🛑 Stopping containers

```bash
make down
```

- Para os containers sem remover volumes.

---

## 🔄 Restarting containers

```bash
make re
```

- Executa `fclean` (limpeza total) e depois `all` (reinicialização completa).

---

## 🗑 Cleaning up

```bash
make clean
```

- Para os containers e remove **volumes temporários**.
- Não remove imagens Docker.

---

## 🔥 Full cleanup

```bash
make fclean
```

- Para os containers.
- Remove **todas as imagens Docker associadas ao projeto**.
- Apaga os volumes e dados armazenados em `/goinfre/$USER/ft_transcendence`.

---

## 📂 Creating directories

```bash
make create_dirs
```

- Cria diretórios para armazenar volumes do Docker em `/goinfre/$USER/ft_transcendence`.

---

## 🔄 Running setup script

```bash
make setup
```

- Executa `setup.sh` para configuração inicial do projeto.

---

## 🗑 Clearing database tables

```bash
make clear-db
```

- Executa `clear_db.sh` para limpar dados das tabelas sem excluir o banco de dados.

---

Este **Makefile** ajuda a manter o ambiente **ft_transcendence** organizado e automatizado. 🚀


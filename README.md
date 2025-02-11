## Starting containers

```bash
docker compose up -d
docker compose exec -it web python manage.py migrate
```

Acesse o app em localhost:3000

## Stopping containers
```bash
docker compose down
```

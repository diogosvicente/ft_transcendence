## Starting containers

```bash
docker compose up -d
docker compose exec -it web python manage.py migrate
```

## Stopping containers
```bash
docker compose down
```

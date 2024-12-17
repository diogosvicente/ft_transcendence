#!/bin/sh

# while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
#   echo "Waiting for Postgres to start..."
#   sleep 0.1
# done

echo "Postgres started"

python manage.py collectstatic
python manage.py migrate
python manage.py runserver
FROM python:3.13-alpine

ENV PYTHONUNBUFFERED 1

ENV PYTHONDONTWRITEBYTECODE 1

ENV SECRET_KEY=django-insecure-#

WORKDIR /app

COPY ./server-pong/ .


RUN	apk update && \
	apk add postgresql-dev gcc && \
	python -m venv /venv && \
	/venv/bin/pip install --upgrade pip && \
	/venv/bin/pip install -r requirements.txt &&\
	adduser --disabled-password --no-create-home duser && \
	mkdir -p /data/web/media && \
	mkdir -p /data/web/static && \
	chown -R duser:duser /venv && \
	chown -R duser:duser /data/web/static && \
	chown -R duser:duser /data/web/media && \
	chmod -R 755 /data/web/static && \
	chmod -R 755 /data/web/media && \
	chmod -R +x /app/scripts

ENV PATH="/app/scripts:/venv/bin:$PATH"

USER duser

EXPOSE 8000

CMD ["commands.sh"]
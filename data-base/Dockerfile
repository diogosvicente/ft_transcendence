FROM postgres:17-alpine

COPY ./data-base/init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432

CMD ["postgres"]
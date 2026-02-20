#!/bin/sh

set -e

echo "Waiting for database..."

# Wait until PostgreSQL is ready
until pg_isready -h ${POSTGRES_HOST:-trade_finance_db} \
                 -p ${POSTGRES_PORT:-5432} \
                 -U ${POSTGRES_USER:-postgres} \
                 -d ${POSTGRES_DB:-postgres}
do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Database is ready!"

echo "Running database migrations..."
alembic upgrade head

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

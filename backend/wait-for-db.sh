#!/bin/bash
set -e

echo "Waiting for database..."
while ! pg_isready -q -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB; do
  echo -n "."
  sleep 1
done

echo "Database is ready!"
echo "Running database migrations..."
alembic upgrade head

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

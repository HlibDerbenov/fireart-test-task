#!/bin/sh
# Wait for DB and run migrations, then start the app.
# This script is intended to run inside the application container.

set -e

RETRIES=${MIGRATE_RETRIES:-30}
SLEEP=${MIGRATE_SLEEP_SEC:-2}

echo "Entrypoint: waiting for database and running migrations (retries=${RETRIES}, sleep=${SLEEP}s)..."

i=0
until [ "$i" -ge "$RETRIES" ]; do
  i=$((i + 1))
  echo "Attempt $i/$RETRIES: running migrations..."
  # Prefer compiled migration runner if present
  if [ -f ./dist/scripts/migrate.js ]; then
    node ./dist/scripts/migrate.js && break || true
  else
    npm run migrate && break || true
  fi
  echo "Migrations not ready yet, sleeping ${SLEEP}s..."
  sleep "$SLEEP"
done

if [ "$i" -ge "$RETRIES" ]; then
  echo "Migrations did not succeed after ${RETRIES} attempts. Exiting."
  exit 1
fi

echo "Migrations applied successfully. Starting app..."
exec node dist/main.js

#!/usr/bin/env sh
set -eu

# Move to app dir (Dockerfile sets WORKDIR but be explicit)
cd /usr/src/app

echo "==> Running migrations (npm run migrate)"
# Run migrations; fail the container if migrations fail
npm run migrate

echo "==> Starting application"
# Prefer running the compiled dist if available
if [ -f ./dist/main.js ]; then
  exec node ./dist/main.js
fi

# Fallback to common npm start scripts
if npm run start:prod >/dev/null 2>&1; then
  exec npm run start:prod
fi

exec npm start
  sleep "$SLEEP"
done

if [ "$i" -ge "$RETRIES" ]; then
  echo "Migrations did not succeed after ${RETRIES} attempts. Exiting."
  exit 1
fi

echo "Migrations applied successfully. Starting app..."
exec node dist/main.js

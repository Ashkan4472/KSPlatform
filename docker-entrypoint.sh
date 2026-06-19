#!/bin/sh
set -e

echo "→ Applying database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "→ Starting Next.js server on ${HOSTNAME}:${PORT}..."
exec node server.js

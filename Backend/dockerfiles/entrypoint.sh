#!/bin/sh
set -e

echo "==> [Render] Initializing Laravel application..."

# Configure Nginx port dynamically from Render's PORT environment variable
RENDER_PORT="${PORT:-10000}"
echo "==> [Render] Setting Nginx listen port to ${RENDER_PORT}..."
sed -i "s/PORT_PLACEHOLDER/${RENDER_PORT}/g" /etc/nginx/http.d/default.conf

# Fallback: ensure APP_KEY is set
if [ -z "$APP_KEY" ]; then
    echo "==> [Render] Notice: APP_KEY is not set in environment. Generating temporary key..."
    export APP_KEY="$(php artisan key:generate --show)"
fi

# Fallback: link RENDER_EXTERNAL_URL to APP_URL if APP_URL is unset or localhost
if [ -n "$RENDER_EXTERNAL_URL" ] && { [ -z "$APP_URL" ] || [ "$APP_URL" = "http://localhost" ]; }; then
    echo "==> [Render] Setting APP_URL to ${RENDER_EXTERNAL_URL}..."
    export APP_URL="${RENDER_EXTERNAL_URL}"
fi

# Create public storage symlink if it doesn't exist
echo "==> [Render] Ensuring storage symlink..."
php artisan storage:link --force || true

# Run database migrations if RUN_MIGRATIONS is true (default: true)
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "==> [Render] Executing database migrations..."
    php artisan migrate --force || echo "==> [Render] Warning: Migration check failed. Will retry on next deploy or manual trigger."
fi

# Cache configuration, routes, and views for optimal production performance
echo "==> [Render] Caching Laravel configuration, routes, and views..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "==> [Render] Handing over to Supervisor (PHP-FPM + Nginx)..."
exec /usr/bin/supervisord -c /etc/supervisord.conf

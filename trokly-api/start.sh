#!/bin/bash
set -e

echo "==> Clearing config..."
php artisan config:clear || true

echo "==> Caching config..."
php artisan config:cache || true

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Seeding roles..."
php artisan db:seed --class=RolesSeeder --force || true

echo "==> Seeding super admin..."
php artisan db:seed --class=SuperAdminSeeder --force || true

echo "==> Starting server on port ${PORT:-10000}..."
exec php artisan serve --host=0.0.0.0 --port=${PORT:-10000}

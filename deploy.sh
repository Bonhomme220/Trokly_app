#!/bin/bash
# ============================================================
# Trokly — Script de déploiement
# Usage : ./deploy.sh [api|web|all]  (défaut : all)
# ============================================================
set -e

TARGET=${1:-all}
ROOT="/var/www/trokly"
API_DIR="$ROOT/trokly-api"
WEB_DIR="$ROOT/trokly-web"

echo ""
echo "🚀  Trokly deploy — cible : $TARGET"
echo "=================================================="

# ── Pull ──────────────────────────────────────────────────
echo "📥  git pull..."
cd "$ROOT"
git pull origin main

# ── API ───────────────────────────────────────────────────
if [[ "$TARGET" == "api" || "$TARGET" == "all" ]]; then
  echo ""
  echo "🐘  Laravel API..."
  cd "$API_DIR"

  composer install --no-dev --optimize-autoloader --no-interaction

  php artisan config:clear
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache

  php artisan migrate --force

  chown -R www-data:www-data storage bootstrap/cache
  chmod -R 775 storage bootstrap/cache

  sudo systemctl reload php8.3-fpm
  echo "   ✅  API OK"
fi

# ── WEB ───────────────────────────────────────────────────
if [[ "$TARGET" == "web" || "$TARGET" == "all" ]]; then
  echo ""
  echo "⚛️   Next.js..."
  cd "$WEB_DIR"

  npm ci --prefer-offline
  npm run build

  pm2 reload trokly-web --update-env
  echo "   ✅  Web OK"
fi

echo ""
echo "✅  Deploy terminé !"

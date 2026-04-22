FROM php:8.2-cli

# System dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev libpng-dev libzip-dev libxml2-dev \
    zip unzip git curl \
    && docker-php-ext-install \
        pdo pdo_pgsql pcntl bcmath gd zip opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Install PHP deps first (layer cache)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy source
COPY . .

# Finalize composer
RUN composer dump-autoload --optimize

# Permissions
RUN chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 10000

CMD php artisan config:clear \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan migrate --force \
    && php artisan db:seed --class=RolesSeeder --force \
    && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}

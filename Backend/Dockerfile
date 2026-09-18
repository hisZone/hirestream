FROM php:8.3-fpm-alpine

# Set working directory
WORKDIR /var/www/html

# Install system dependencies and build libraries
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    git \
    freetype-dev \
    icu-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libpq-dev \
    libwebp-dev \
    libzip-dev \
    oniguruma-dev \
    unzip \
    zip

# Install and configure required PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_mysql \
        pdo_pgsql \
        zip \
        gd \
        mbstring \
        exif \
        pcntl \
        bcmath \
        calendar \
        intl \
        opcache

# Production PHP settings & OPcache tuning
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'opcache.validate_timestamps=0'; \
    echo 'opcache.save_comments=1'; \
} > /usr/local/etc/php/conf.d/opcache.ini

RUN { \
    echo 'upload_max_filesize=64M'; \
    echo 'post_max_size=64M'; \
    echo 'memory_limit=256M'; \
    echo 'expose_php=Off'; \
} > /usr/local/etc/php/conf.d/custom.ini

# Configure PHP-FPM to run cleanly with Nginx
RUN sed -i "s/user = www-data/user = www-data/g" /usr/local/etc/php-fpm.d/www.conf \
    && sed -i "s/group = www-data/group = www-data/g" /usr/local/etc/php-fpm.d/www.conf \
    && sed -i "s/listen = 127.0.0.1:9000/listen = 127.0.0.1:9000/g" /usr/local/etc/php-fpm.d/www.conf

# Prepare directories for Nginx and Supervisor
RUN mkdir -p /run/nginx /var/log/supervisor

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# Copy application source code
COPY . /var/www/html

# Install production Composer dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

# Ensure directories and permissions for Laravel
RUN mkdir -p /var/www/html/storage/framework/cache \
    && mkdir -p /var/www/html/storage/framework/sessions \
    && mkdir -p /var/www/html/storage/framework/views \
    && mkdir -p /var/www/html/storage/logs \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Copy deployment configurations
COPY dockerfiles/nginx-render.conf /etc/nginx/http.d/default.conf
COPY dockerfiles/supervisord.conf /etc/supervisord.conf
COPY dockerfiles/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

# Render default exposed port
EXPOSE 10000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

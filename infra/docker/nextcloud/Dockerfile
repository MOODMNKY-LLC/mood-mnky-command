# MNKY CLOUD – Nextcloud image overlay
# Base: official Nextcloud image; copy theme and custom config at build time.
# Theme CSS is published to Supabase Storage; optionally copy from build context.
FROM nextcloud:latest

# Example: copy local theme if built into context by publish script.
# COPY mnky.css /usr/src/nextcloud/core/css/
# For CDN-based theming, inject mnky.css via reverse proxy or Nextcloud custom_css app.

USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagickcore-6.q16-6-extra \
    && rm -rf /var/lib/apt/lists/*
USER www-data

EXPOSE 8080

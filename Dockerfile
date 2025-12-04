# --- Stage 1: Build CSS ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy Tailwind config and source CSS
COPY tailwind.config.js ./
COPY css ./css
# Copy HTML/JS files (needed for Tailwind content scan)
COPY index.html ./
COPY js ./js

# Build CSS
RUN npm run build:css

# --- Organize Vendor Files (in Builder) ---
RUN mkdir -p js/vendor css/vendor/leaflet

# Leaflet
RUN cp node_modules/leaflet/dist/leaflet.js js/vendor/leaflet.js \
    && cp node_modules/leaflet/dist/leaflet.css css/vendor/leaflet/leaflet.css \
    && cp -r node_modules/leaflet/dist/images css/vendor/leaflet/images

# AOS
RUN cp node_modules/aos/dist/aos.js js/vendor/aos.js \
    && cp node_modules/aos/dist/aos.css css/vendor/aos.css

# Flatpickr
RUN cp node_modules/flatpickr/dist/flatpickr.min.js js/vendor/flatpickr.js \
    && cp node_modules/flatpickr/dist/l10n/fr.js js/vendor/flatpickr-fr.js \
    && cp node_modules/flatpickr/dist/flatpickr.min.css css/vendor/flatpickr.css

# Lucide
RUN cp node_modules/lucide/dist/umd/lucide.min.js js/vendor/lucide.js


# --- Stage 2: Final Image ---
FROM alpine:latest

# PocketBase Version
ARG PB_VERSION=0.22.21

# SEO Build Arguments
ARG SEO_TITLE="Maison de Vacances"
ARG SEO_DESCRIPTION=""
ARG SEO_URL=""
ARG SEO_IMAGE=""
ARG SEO_FAVICON="img/favicon.png"
ARG SEO_PRICE_RANGE=""
ARG SEO_PHONE=""
ARG SEO_LAT="0"
ARG SEO_LNG="0"
ARG SEO_ADDRESS_STREET=""
ARG SEO_ADDRESS_ZIP=""
ARG SEO_ADDRESS_LOCALITY=""

# Persist as Environment Variables
ENV SEO_TITLE=$SEO_TITLE \
    SEO_DESCRIPTION=$SEO_DESCRIPTION \
    SEO_URL=$SEO_URL \
    SEO_IMAGE=$SEO_IMAGE \
    SEO_FAVICON=$SEO_FAVICON \
    SEO_PRICE_RANGE=$SEO_PRICE_RANGE \
    SEO_PHONE=$SEO_PHONE \
    SEO_LAT=$SEO_LAT \
    SEO_LNG=$SEO_LNG \
    SEO_ADDRESS_STREET=$SEO_ADDRESS_STREET \
    SEO_ADDRESS_ZIP=$SEO_ADDRESS_ZIP \
    SEO_ADDRESS_LOCALITY=$SEO_ADDRESS_LOCALITY


# 1. Install dependencies
RUN apk add --no-cache unzip ca-certificates wget jq

# 2. Download and install PocketBase
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
    && chmod +x /pocketbase \
    && rm pocketbase_${PB_VERSION}_linux_amd64.zip

# 3. Prepare the public directory
RUN mkdir -p /pb_public

# 4. Copy static site assets
COPY index.html /pb_public/index.html

# Copy JS and CSS (including vendor files and built CSS from builder)
COPY --from=builder /app/js /pb_public/js
COPY --from=builder /app/css /pb_public/css

# Copy config for SEO injection
# Config is optional. If not present, SEO injection is skipped (handled in entrypoint.sh).
# We do not copy it here to avoid build errors in CI/CD where config.json is missing.


# Create img directory
RUN mkdir -p /pb_public/img

# Copy PocketBase Hooks
COPY pb_hooks /pb_hooks

# 5. Copy and setup Entrypoint Script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 6. Expose the port
EXPOSE 8090

# 7. Start
ENTRYPOINT ["/entrypoint.sh"]
CMD ["/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--publicDir=/pb_public"]

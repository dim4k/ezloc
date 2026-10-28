# --- Stage 1: Build CSS ---
FROM node:24-alpine AS builder

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

# --- Vendor files: libraries, fonts and the Lucide icon subset (scans js/ for the icons used) ---
COPY scripts ./scripts
RUN npm run vendor


# --- Stage 2: Final Image ---
FROM alpine:3.24

# PocketBase version and the SHA-256 of its linux_amd64 zip (from the release's checksums.txt)
ARG PB_VERSION=0.40.6
ARG PB_SHA256=0e1f609158ed945f809f8a02ae012aa0427129c66ebb63c1aee76f2c0309373f

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
RUN apk add --no-cache unzip ca-certificates wget jq su-exec

# Unprivileged user running PocketBase (see entrypoint.sh)
RUN adduser -D -H -u 1000 pb

# 2. Download, verify and install PocketBase
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && echo "${PB_SHA256}  pocketbase_${PB_VERSION}_linux_amd64.zip" | sha256sum -c - \
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
COPY pb_migrations /pb_migrations

# 5. Copy and setup Entrypoint Script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 6. Expose the port
EXPOSE 8090

# 7. Start
ENTRYPOINT ["/entrypoint.sh"]
# --indexFallback=false: unknown paths answer 404 instead of the home page (the site only uses "/" and #anchors)
CMD ["/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--publicDir=/pb_public", "--indexFallback=false"]

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

# --- Stage 2: Final Image ---
FROM alpine:latest

# PocketBase Version
ARG PB_VERSION=0.22.21

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
COPY js /pb_public/js
# COPY Generated CSS from builder stage
COPY --from=builder /app/css/style.css /pb_public/css/style.css

# Copy config for SEO injection
COPY setup/config.json /pb_public/config.json

# Create img directory
RUN mkdir -p /pb_public/img

# 5. Copy and setup Entrypoint Script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 6. Expose the port
EXPOSE 8090

# 7. Start
ENTRYPOINT ["/entrypoint.sh"]
CMD ["/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--publicDir=/pb_public"]

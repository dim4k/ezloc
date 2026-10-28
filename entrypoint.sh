#!/bin/sh

# Path to config file
CONFIG_FILE="/pb_public/config.json"
INDEX_FILE="/pb_public/index.html"

echo "🚀 Starting Entrypoint Script..."

# 1. Initialize variables with ENV defaults (from Dockerfile)
# The other SEO_* variables (image, favicon, address, phone…) are read by pb_hooks/lib/seo.js,
# as fallbacks when the CMS has no value.
TITLE="${SEO_TITLE:-Maison de Vacances}"
DESCRIPTION="${SEO_DESCRIPTION:-}"
URL="${SEO_URL:-}"

echo "Injecting SEO data..."

# Replace in index.html using sed
# We use | as delimiter to avoid issues with / in URLs
sed -i "s|{{SEO_TITLE}}|$TITLE|g" $INDEX_FILE
sed -i "s|{{SEO_DESCRIPTION}}|$DESCRIPTION|g" $INDEX_FILE
sed -i "s|{{SEO_URL}}|$URL|g" $INDEX_FILE

echo "✅ SEO data injected."

# --- Generate robots.txt (the sitemap itself is rendered by pb_hooks/seo.pb.js) ---
# No rules: everything is allowed. Behind Cloudflare, its managed robots.txt is prepended to this one.
if [ -n "$URL" ]; then
    echo "🤖 Generating robots.txt..."
    cat <<EOF > /pb_public/robots.txt
Sitemap: ${URL%/}/sitemap.xml
EOF
fi

# Execute the CMD from Dockerfile (PocketBase) as the unprivileged "pb" user.
# pb_data may come from an older image that ran as root: hand over whatever pb does not own yet.
if [ "$(id -u)" = "0" ]; then
    mkdir -p /pb_data
    find /pb_data ! -user pb -exec chown pb:pb {} +
    exec su-exec pb "$@"
fi
exec "$@"

#!/bin/sh

# Path to config file
CONFIG_FILE="/pb_public/config.json"
INDEX_FILE="/pb_public/index.html"

echo "🚀 Starting Entrypoint Script..."

# 1. Initialize variables with ENV defaults (from Dockerfile)
TITLE="${SEO_TITLE:-Maison de Vacances}"
DESCRIPTION="${SEO_DESCRIPTION:-}"
URL="${SEO_URL:-}"
IMAGE="${SEO_IMAGE:-}"

# Other defaults
FAVICON="${SEO_FAVICON:-img/favicon.png}"
PRICE_RANGE="${SEO_PRICE_RANGE:-}"
PHONE="${SEO_PHONE:-}"
LAT="${SEO_LAT:-0}"
LNG="${SEO_LNG:-0}"
ADDRESS_STREET="${SEO_ADDRESS_STREET:-}"
ADDRESS_ZIP="${SEO_ADDRESS_ZIP:-}"
ADDRESS_LOCALITY="${SEO_ADDRESS_LOCALITY:-}"

# Resolve Image URL
case "$IMAGE" in
    http*) ;;
    *) 
       # Only prepend URL if URL is set and image is relative
       if [ -n "$URL" ] && [ -n "$IMAGE" ]; then
           IMAGE="${URL%/}/${IMAGE#./}" 
       fi
       ;;
esac

echo "Injecting SEO data..."

# Replace in index.html using sed
# We use | as delimiter to avoid issues with / in URLs
sed -i "s|{{SEO_TITLE}}|$TITLE|g" $INDEX_FILE
sed -i "s|{{SEO_DESCRIPTION}}|$DESCRIPTION|g" $INDEX_FILE
sed -i "s|{{SEO_URL}}|$URL|g" $INDEX_FILE
sed -i "s|{{SEO_IMAGE}}|$IMAGE|g" $INDEX_FILE
sed -i "s|{{SEO_FAVICON}}|$FAVICON|g" $INDEX_FILE

sed -i "s|{{SEO_PHONE}}|$PHONE|g" $INDEX_FILE
sed -i "s|{{SEO_PRICE_RANGE}}|$PRICE_RANGE|g" $INDEX_FILE
sed -i "s|{{SEO_LAT}}|$LAT|g" $INDEX_FILE
sed -i "s|{{SEO_LNG}}|$LNG|g" $INDEX_FILE

sed -i "s|{{SEO_ADDRESS_STREET}}|$ADDRESS_STREET|g" $INDEX_FILE
sed -i "s|{{SEO_ADDRESS_ZIP}}|$ADDRESS_ZIP|g" $INDEX_FILE
sed -i "s|{{SEO_ADDRESS_LOCALITY}}|$ADDRESS_LOCALITY|g" $INDEX_FILE

echo "✅ SEO data injected."

# --- Generate robots.txt ---
if [ -n "$URL" ]; then
    echo "🤖 Generating robots.txt..."
    cat <<EOF > /pb_public/robots.txt
User-agent: *
Allow: /

Sitemap: ${URL%/}/sitemap.xml
EOF

    # --- Generate sitemap.xml ---
    echo "🗺️ Generating sitemap.xml..."
    cat <<EOF > /pb_public/sitemap.xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${URL%/}/</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>
EOF
fi

# Execute the CMD from Dockerfile (PocketBase)
exec "$@"

#!/bin/sh

# Path to config file
CONFIG_FILE="/pb_public/config.json"
INDEX_FILE="/pb_public/index.html"

echo "🚀 Starting Entrypoint Script..."

if [ -f "$CONFIG_FILE" ]; then
    echo "📄 Found config.json, injecting SEO data..."
    
    # Extract values using jq
    TITLE=$(jq -r '.site_info.seo.title // "Maison de Vacances"' $CONFIG_FILE)
    DESCRIPTION=$(jq -r '.site_info.seo.description // ""' $CONFIG_FILE)
    URL=$(jq -r '.site_info.seo.url // ""' $CONFIG_FILE)
    IMAGE=$(jq -r '.site_info.seo.image // ""' $CONFIG_FILE)
    FAVICON=$(jq -r '.site_info.favicon // "img/favicon.png"' $CONFIG_FILE)
    PRICE_RANGE=$(jq -r '.site_info.seo.priceRange // ""' $CONFIG_FILE)
    
    PHONE=$(jq -r '.contact.phone // ""' $CONFIG_FILE)
    
    # Location details
    LAT=$(jq -r '.location.lat // 0' $CONFIG_FILE)
    LNG=$(jq -r '.location.lng // 0' $CONFIG_FILE)
    
    # Address parsing (Basic assumption: Address field contains full address with <br>)
    # For JSON-LD we need structured data. Let's try to extract from config or use defaults.
    # Ideally config should have structured address. For now, let's hardcode the extraction or use specific fields if added.
    # Let's assume the user might add structured address later, but for now we'll use jq to parse the string if possible or just inject defaults if missing.
    # Actually, let's just read from config.location.address and split it or assume new fields.
    # To keep it simple and robust, let's assume we add these specific fields to config.location for SEO purposes or parse them.
    # Let's use what we have:
    ADDRESS_FULL=$(jq -r '.location.address // ""' $CONFIG_FILE)
    # Simple heuristic: Split by <br> or comma
    ADDRESS_STREET=$(echo "$ADDRESS_FULL" | sed 's/<br>.*//' | sed 's/,.*//')
    ADDRESS_ZIP_CITY=$(echo "$ADDRESS_FULL" | sed 's/.*<br>//' | sed 's/.*,//')
    # This is brittle. Let's just use placeholders that match the config structure if possible.
    # Better: Add specific fields to config.json for structured address if strictly needed.
    # Or just use the values we know are there.
    # The user wants to remove hardcoded values.
    # Let's extract zip and city from the end of the string.
    ADDRESS_ZIP=$(echo "$ADDRESS_ZIP_CITY" | grep -oE '[0-9]{5}')
    ADDRESS_LOCALITY=$(echo "$ADDRESS_ZIP_CITY" | sed "s/$ADDRESS_ZIP//g" | xargs) # Trim

    # Resolve Image URL (if it's relative, prepend URL)
    # Simple check: if it doesn't start with http, prepend URL
    case "$IMAGE" in
        http*) ;;
        *) IMAGE="${URL%/}/${IMAGE#./}" ;;
    esac

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

    sed -i "s|{{SEO_ADDRESS_ZIP}}|$ADDRESS_ZIP|g" $INDEX_FILE
    sed -i "s|{{SEO_ADDRESS_LOCALITY}}|$ADDRESS_LOCALITY|g" $INDEX_FILE

    echo "✅ SEO data injected."

    # --- Generate robots.txt ---
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

else
    echo "⚠️ config.json not found at $CONFIG_FILE. Skipping SEO injection."
fi

# Execute the CMD from Dockerfile (PocketBase)
exec "$@"

const fs = require('fs');
const path = require('path');

// Configuration
const PB_URL = process.env.PB_URL || 'http://192.168.1.62:8090';
const ADMIN_EMAIL = process.argv[2];
const ADMIN_PASS = process.argv[3];

if (!ADMIN_EMAIL || !ADMIN_PASS) {
    console.error("❌ Usage: node setup/init_cms.js <admin_email> <admin_password>");
    console.log("   Example: node setup/init_cms.js admin@example.com 1234567890");
    process.exit(1);
}

// Paths relative to this script (located in /setup)
const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const SCHEMA_PATH = path.join(__dirname, 'pb_schema.json');
const IMG_BASE_PATH = path.join(__dirname, 'img');

function resolveImagePath(relativePath) {
    if (!relativePath) return null;
    // Remove ./img/ or img/ prefix
    const cleanPath = relativePath.replace(/^(\.\/)?img\//, '');
    return path.join(IMG_BASE_PATH, cleanPath);
}

async function main() {
    try {
        console.log(`🚀 Starting CMS initialization on ${PB_URL}...`);

        // 1. Authenticate
        console.log("🔑 Authenticating...");
        let token;
        try {
            const authData = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASS })
            }).then(r => r.json());
            
            if (!authData.token) throw new Error(JSON.stringify(authData));
            token = authData.token;
        } catch (e) {
            throw new Error(`Authentication failed. Check your credentials and ensure PocketBase is running at ${PB_URL}. Details: ${e.message}`);
        }
        console.log("✅ Authenticated.");

        // 2. Import Schema
        console.log("📜 Importing Schema...");
        if (fs.existsSync(SCHEMA_PATH)) {
            const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
            for (const collection of schema) {
                try {
                    // Check if collection exists
                    const existing = await fetch(`${PB_URL}/api/collections/${collection.name}`, {
                        headers: { 'Authorization': token }
                    }).then(r => r.ok ? r.json() : null);

                    if (existing) {
                        console.log(`🔄 Updating schema for ${collection.name}...`);
                        await fetch(`${PB_URL}/api/collections/${existing.id}`, {
                            method: 'PATCH',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': token
                            },
                            body: JSON.stringify(collection)
                        });
                    } else {
                        console.log(`✨ Creating collection ${collection.name}...`);
                        await fetch(`${PB_URL}/api/collections`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': token
                            },
                            body: JSON.stringify(collection)
                        });
                    }
                } catch (e) {
                    console.log(`⚠️ Error importing collection ${collection.name}: ${e.message}`);
                }
            }
            console.log("✅ Schema imported.");
        } else {
            console.warn("⚠️ pb_schema.json not found, skipping schema creation.");
        }

        // 3. Read Config
        if (!fs.existsSync(CONFIG_PATH)) {
            throw new Error("config.json not found in root directory.");
        }
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

        // 4. Migrate Site Info
        console.log("🏠 Migrating Site Info...");
        const existingInfo = await fetch(`${PB_URL}/api/collections/site_info/records?perPage=1`, {
            headers: { 'Authorization': token }
        }).then(r => r.json());

        const siteInfoData = new FormData();
        siteInfoData.append('name', config.site_info.name);
        siteInfoData.append('tagline', config.site_info.tagline || "");
        siteInfoData.append('description', config.site_info.description);
        
        if (config.site_info.hero) {
            siteInfoData.append('heroTitle', config.site_info.hero.title);
            siteInfoData.append('heroSubtitle', config.site_info.hero.subtitle);
            if (config.site_info.hero.image) {
                const imgPath = resolveImagePath(config.site_info.hero.image);
                if (imgPath && fs.existsSync(imgPath)) {
                    const file = new File([fs.readFileSync(imgPath)], path.basename(imgPath));
                    siteInfoData.append('heroImage', file);
                }
            }
        }

        if (config.site_info.favicon) {
            const imgPath = resolveImagePath(config.site_info.favicon);
            if (imgPath && fs.existsSync(imgPath)) {
                const file = new File([fs.readFileSync(imgPath)], path.basename(imgPath));
                siteInfoData.append('favicon', file);
            }
        }

        if (config.site_info.island) {
            siteInfoData.append('islandTitle', config.site_info.island.title);
            siteInfoData.append('islandSubtitle', config.site_info.island.subtitle);
        }

        siteInfoData.append('labels', JSON.stringify(config.site_info.labels));
        siteInfoData.append('amenities', JSON.stringify(config.site_info.amenities));

        if (existingInfo.items && existingInfo.items.length > 0) {
            await fetch(`${PB_URL}/api/collections/site_info/records/${existingInfo.items[0].id}`, {
                method: 'PATCH',
                headers: { 'Authorization': token },
                body: siteInfoData
            });
        } else {
            await fetch(`${PB_URL}/api/collections/site_info/records`, {
                method: 'POST',
                headers: { 'Authorization': token },
                body: siteInfoData
            });
        }
        console.log("✅ Site Info migrated.");

        // 4b. Migrate Contact
        console.log("📞 Migrating Contact...");
        const contactData = {
            email: config.contact.email,
            phone: config.contact.phone,
            name: config.contact.name,
            airbnbUrl: config.contact.airbnbUrl
        };
        await fetch(`${PB_URL}/api/collections/contact/records`, {
            method: 'POST',
            headers: { 'Authorization': token, 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData)
        });

        // 4c. Migrate Location
        if (config.location) {
            console.log("📍 Migrating Location...");
            const locData = {
                lat: config.location.lat,
                lng: config.location.lng,
                address: config.location.address,
                zoom: config.location.mapZoom
            };
            await fetch(`${PB_URL}/api/collections/location/records`, {
                method: 'POST',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify(locData)
            });
        }

        // 4d. Migrate Pricing
        if (config.pricing) {
            console.log("💰 Migrating Pricing...");
            const pricingConfig = {
                cleaningFee: config.pricing.cleaningFee,
                defaultPrice: config.pricing.defaultPrice,
                details: JSON.stringify(config.pricing.details || [])
            };
            await fetch(`${PB_URL}/api/collections/pricing_config/records`, {
                method: 'POST',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify(pricingConfig)
            });

            if (config.pricing.periods) {
                for (const period of config.pricing.periods) {
                    await fetch(`${PB_URL}/api/collections/pricing_periods/records`, {
                        method: 'POST',
                        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                        body: JSON.stringify(period)
                    });
                }
            }
        }

        // 5. Migrate Features
        console.log("🛏️ Migrating Features...");
        // Delete existing to avoid duplicates? For safety, let's just add.
        // Ideally we should check unique IDs but we are simplifying.
        
        if (config.features) {
            for (let i = 0; i < config.features.length; i++) {
                const feat = config.features[i];
                const formData = new FormData();
                formData.append('title', feat.title);
                formData.append('shortDesc', feat.shortDesc);
                formData.append('fullDesc', feat.fullDesc);
                formData.append('icon', feat.icon);
                formData.append('order', i);

                if (feat.thumbnail) {
                    const thumbPath = resolveImagePath(feat.thumbnail);
                    if (thumbPath && fs.existsSync(thumbPath)) {
                        const file = new File([fs.readFileSync(thumbPath)], path.basename(thumbPath));
                        formData.append('thumbnail', file);
                    }
                }

                if (feat.gallery) {
                    for (const imgStr of feat.gallery) {
                        const imgPath = resolveImagePath(imgStr);
                        if (imgPath && fs.existsSync(imgPath)) {
                            const file = new File([fs.readFileSync(imgPath)], path.basename(imgPath));
                            formData.append('gallery', file);
                        }
                    }
                }

                await fetch(`${PB_URL}/api/collections/features/records`, {
                    method: 'POST',
                    headers: { 'Authorization': token },
                    body: formData
                });
            }
        }
        console.log("✅ Features migrated.");

        // 6. Migrate Activities
        console.log("boats Migrating Activities...");
        if (config.activities) {
            const activities = config.activities;
            for (let i = 0; i < activities.length; i++) {
                const act = activities[i];
                const formData = new FormData();
                formData.append('title', act.title);
                formData.append('description', act.description);
                formData.append('order', i);

                if (act.images) {
                    for (const imgStr of act.images) {
                        const imgPath = resolveImagePath(imgStr);
                        if (imgPath && fs.existsSync(imgPath)) {
                            const file = new File([fs.readFileSync(imgPath)], path.basename(imgPath));
                            formData.append('images', file);
                        }
                    }
                }

                await fetch(`${PB_URL}/api/collections/activities/records`, {
                    method: 'POST',
                    headers: { 'Authorization': token },
                    body: formData
                });
            }
        }
        console.log("✅ Activities migrated.");
        console.log("🎉 INITIALIZATION COMPLETE!");

    } catch (error) {
        console.error("❌ Initialization failed:", error);
        process.exit(1);
    }
}

main();

const fs = require('fs');
const path = require('path');

// Configuration
const PB_URL = process.env.PB_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.argv[2];
const ADMIN_PASS = process.argv[3];

if (!ADMIN_EMAIL || !ADMIN_PASS) {
    console.error("❌ Usage: node setup/init_cms.js <admin_email> <admin_password>");
    console.log("   Example: node setup/init_cms.js admin@example.com 1234567890");
    process.exit(1);
}

// Paths relative to this script (located in /setup)
const CONFIG_PATH = path.join(__dirname, 'config.json');
const IMG_BASE_PATH = path.join(__dirname, 'img');

function resolveImagePath(relativePath) {
    if (!relativePath) return null;
    // Remove ./img/ or img/ prefix
    const cleanPath = relativePath.replace(/^(\.\/)?img\//, '');
    return path.join(IMG_BASE_PATH, cleanPath);
}

async function main() {
    async function safeFetch(url, options) {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Request to ${url} failed with status ${response.status}: ${errorText}`);
        }
        return response.json();
    }

    try {
        console.log(`🚀 Starting CMS initialization on ${PB_URL}...`);

        // 1. Authenticate
        console.log("🔑 Authenticating...");
        const authData = await safeFetch(`${PB_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASS })
        });
        
        const token = authData.token;
        console.log("✅ Authenticated.");

        // 2. Schema Import handled by migrations
        console.log("📜 Schema checks handled by PocketBase migrations.");

        // 3. Read Config
        if (!fs.existsSync(CONFIG_PATH)) {
            throw new Error("config.json not found in root directory.");
        }
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

        // 4. Migrate Site Identity
        console.log("🆔 Migrating Site Identity...");
        const identityData = new FormData();
        identityData.append('name', config.site_identity.name);
        identityData.append('tagline', config.site_identity.tagline || "");
        identityData.append('description', config.site_identity.description);
        identityData.append('labels', JSON.stringify(config.site_identity.labels));

        if (config.site_identity.favicon) {
            const imgPath = resolveImagePath(config.site_identity.favicon);
            if (imgPath && fs.existsSync(imgPath)) {
                const file = new File([fs.readFileSync(imgPath)], path.basename(imgPath));
                identityData.append('favicon', file);
            }
        }
        await safeFetch(`${PB_URL}/api/collections/site_identity/records`, { method: 'POST', headers: { 'Authorization': token }, body: identityData });

        // 4b. Migrate Welcome Section
        console.log("👋 Migrating Welcome Section...");
        const welcomeData = new FormData();
        if (config.welcome) {
            welcomeData.append('title', config.welcome.title);
            welcomeData.append('subtitle', config.welcome.subtitle);
            if (config.welcome.image) {
                const imgPath = resolveImagePath(config.welcome.image);
                if (imgPath && fs.existsSync(imgPath)) {
                    const file = new File([fs.readFileSync(imgPath)], path.basename(imgPath));
                    welcomeData.append('image', file);
                }
            }
        }
        await safeFetch(`${PB_URL}/api/collections/welcome/records`, { method: 'POST', headers: { 'Authorization': token }, body: welcomeData });

        // 4c. Migrate House Config
        console.log("🏠 Migrating House Config...");
        const houseConfigData = new FormData();
        if (config.house_config) {
             houseConfigData.append('title', config.house_config.title);
             houseConfigData.append('subtitle', config.house_config.subtitle);
             houseConfigData.append('amenities', JSON.stringify(config.house_config.amenities));
        }
        await safeFetch(`${PB_URL}/api/collections/house_config/records`, { method: 'POST', headers: { 'Authorization': token }, body: houseConfigData });

        // 4d. Migrate Activities Config
        console.log("b Migrating Activities Config...");
        const activitiesConfigData = new FormData();
        if (config.activities_config) {
            activitiesConfigData.append('title', config.activities_config.title);
            activitiesConfigData.append('subtitle', config.activities_config.subtitle);
        }
        await safeFetch(`${PB_URL}/api/collections/activities_config/records`, { method: 'POST', headers: { 'Authorization': token }, body: activitiesConfigData });

        // 4b. Migrate Contact
        console.log("📞 Migrating Contact...");
        const contactData = {
            email: config.contact.email,
            phone: config.contact.phone,
            name: config.contact.name,
            airbnbUrl: config.contact.airbnbUrl
        };
        await safeFetch(`${PB_URL}/api/collections/contact/records`, {
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
            await safeFetch(`${PB_URL}/api/collections/location/records`, {
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
            await safeFetch(`${PB_URL}/api/collections/pricing_config/records`, {
                method: 'POST',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify(pricingConfig)
            });

            if (config.pricing.periods) {
                for (const period of config.pricing.periods) {
                    await safeFetch(`${PB_URL}/api/collections/pricing_periods/records`, {
                        method: 'POST',
                        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                        body: JSON.stringify(period)
                    });
                }
            }
        }

        // 5. Migrate House Features
        console.log("🛏️ Migrating House Features...");
        if (config.house_features) {
            for (let i = 0; i < config.house_features.length; i++) {
                const feat = config.house_features[i];
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

                await safeFetch(`${PB_URL}/api/collections/house_features/records`, {
                    method: 'POST',
                    headers: { 'Authorization': token },
                    body: formData
                });
            }
        }
        console.log("✅ House Features migrated.");

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

                await safeFetch(`${PB_URL}/api/collections/activities/records`, {
                    method: 'POST',
                    headers: { 'Authorization': token },
                    body: formData
                });
            }
        }
        console.log("✅ Activities migrated.");

        // 7. Migrate FAQ
        console.log("❓ Migrating FAQ...");
        if (config.faq) {
            const faqs = config.faq;
            for (let i = 0; i < faqs.length; i++) {
                const item = faqs[i];
                const formData = new FormData();
                formData.append('question', item.question);
                formData.append('answer', item.answer);
                formData.append('order', i);

                await safeFetch(`${PB_URL}/api/collections/faq/records`, {
                    method: 'POST',
                    headers: { 'Authorization': token },
                    body: formData
                });
            }
        }
        console.log("✅ FAQ migrated.");
        console.log("🎉 INITIALIZATION COMPLETE!");

    } catch (error) {
        console.error("❌ Initialization failed:", error);
        process.exit(1);
    }
}

main();

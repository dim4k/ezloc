import { SITE_CONFIG } from "./config.js";

// Auto-detect PocketBase URL
// If served from the same origin (which is the case with PocketBase serving public dir), 
// we can use the current origin.
export const PB_URL = window.location.origin;

/**
 * Initialize the CMS connection and update the SITE_CONFIG
 */
export async function initCMS() {
    try {
        console.log("🔌 Connecting to PocketBase...");
        
        // 1. Fetch Site Info (Singleton)
        const siteInfoRecord = await fetch(`${PB_URL}/api/collections/site_info/records?perPage=1&sort=-created`)
            .then(r => r.json())
            .then(data => data.items ? data.items[0] : null);

        // 1b. Fetch Contact (Singleton)
        const contactRecord = await fetch(`${PB_URL}/api/collections/contact/records?perPage=1&sort=-created`)
            .then(r => r.json())
            .then(data => data.items ? data.items[0] : null);

        // 1c. Fetch Location (Singleton)
        const locationRecord = await fetch(`${PB_URL}/api/collections/location/records?perPage=1&sort=-created`)
            .then(r => r.json())
            .then(data => data.items ? data.items[0] : null);

        // 1d. Fetch Pricing Config (Singleton)
        const pricingConfigRecord = await fetch(`${PB_URL}/api/collections/pricing_config/records?perPage=1&sort=-created`)
            .then(r => r.json())
            .then(data => data.items ? data.items[0] : null);

        // 1e. Fetch Pricing Periods (List)
        const pricingPeriodsRecords = await fetch(`${PB_URL}/api/collections/pricing_periods/records?sort=start`)
            .then(r => r.json())
            .then(data => data.items || []);

        if (!siteInfoRecord) {
            console.warn("⚠️ No site_info found in CMS. Using local config.");
            return;
        }

        // 2. Fetch Features (List)
        const featuresRecords = await fetch(`${PB_URL}/api/collections/features/records?sort=order`)
            .then(r => r.json())
            .then(data => data.items || []);

        // 3. Fetch Activities (List)
        const activitiesRecords = await fetch(`${PB_URL}/api/collections/activities/records?sort=order`)
            .then(r => r.json())
            .then(data => data.items || []);

        // 4. Fetch FAQs (List)
        const faqRecords = await fetch(`${PB_URL}/api/collections/faq/records?sort=order`)
            .then(r => r.json())
            .then(data => data.items || []);

        // --- Helper to get file URL ---
        const getFileUrl = (record, filename) => {
            if (!filename) return "";
            return `${PB_URL}/api/files/${record.collectionId}/${record.id}/${filename}`;
        };

        // Contact
        if (contactRecord) {
            if (contactRecord.email) SITE_CONFIG.general.bookingEmail = contactRecord.email;
            if (contactRecord.phone) SITE_CONFIG.general.bookingPhone = contactRecord.phone;
            if (contactRecord.name) SITE_CONFIG.general.contactName = contactRecord.name;
            if (contactRecord.airbnbUrl) SITE_CONFIG.general.airbnbCalendarUrl = contactRecord.airbnbUrl;
            if (contactRecord.captchaSiteKey) SITE_CONFIG.general.captchaSiteKey = contactRecord.captchaSiteKey;
        }

        // Pricing
        if (pricingConfigRecord) {
            if (pricingConfigRecord.cleaningFee) SITE_CONFIG.general.pricing.cleaningFee = pricingConfigRecord.cleaningFee;
            if (pricingConfigRecord.defaultPrice) SITE_CONFIG.general.pricing.defaultPrice = pricingConfigRecord.defaultPrice;
            // Map details to the display pricing object, not the calculation one
            if (pricingConfigRecord.details) SITE_CONFIG.pricing.details = pricingConfigRecord.details;
        }
        if (pricingPeriodsRecords.length > 0) {
            SITE_CONFIG.general.pricing.periods = pricingPeriodsRecords.map(p => ({
                start: p.start,
                end: p.end,
                price: p.price
            }));
        }

        // Location
        if (locationRecord) {
            if (locationRecord.lat) SITE_CONFIG.location.lat = locationRecord.lat;
            if (locationRecord.lng) SITE_CONFIG.location.lng = locationRecord.lng;
            if (locationRecord.address) SITE_CONFIG.location.address = locationRecord.address;
            if (locationRecord.zoom) SITE_CONFIG.location.mapZoom = locationRecord.zoom;
        }

        // JSON Fields
        if (siteInfoRecord.labels) SITE_CONFIG.labels = siteInfoRecord.labels;
        if (siteInfoRecord.amenities) SITE_CONFIG.amenities = siteInfoRecord.amenities;

        // General Info
        if (siteInfoRecord.name) SITE_CONFIG.general.name = siteInfoRecord.name;
        if (siteInfoRecord.tagline) SITE_CONFIG.general.tagline = siteInfoRecord.tagline;
        if (siteInfoRecord.description) SITE_CONFIG.general.description = siteInfoRecord.description;

        // Hero
        if (siteInfoRecord.heroTitle) SITE_CONFIG.hero.title = siteInfoRecord.heroTitle;
        if (siteInfoRecord.heroSubtitle) SITE_CONFIG.hero.subtitle = siteInfoRecord.heroSubtitle;
        if (siteInfoRecord.heroImage) SITE_CONFIG.hero.image = getFileUrl(siteInfoRecord, siteInfoRecord.heroImage);
        
        // Favicon
        if (siteInfoRecord.favicon) {
            const faviconUrl = getFileUrl(siteInfoRecord, siteInfoRecord.favicon);
            const link = document.querySelector("link[rel~='icon']");
            if (link) {
                link.href = faviconUrl;
            } else {
                const newLink = document.createElement("link");
                newLink.rel = "icon";
                newLink.href = faviconUrl;
                document.head.appendChild(newLink);
            }
        }

        // Island
        if (siteInfoRecord.islandTitle) SITE_CONFIG.island.title = siteInfoRecord.islandTitle;
        if (siteInfoRecord.islandSubtitle) SITE_CONFIG.island.subtitle = siteInfoRecord.islandSubtitle;

        // Features
        if (featuresRecords.length > 0) {
            SITE_CONFIG.features = featuresRecords.map(f => ({
                id: f.id,
                title: f.title,
                shortDesc: f.shortDesc,
                fullDesc: f.fullDesc,
                icon: f.icon,
                thumbnail: getFileUrl(f, f.thumbnail),
                gallery: f.gallery ? f.gallery.map(img => getFileUrl(f, img)) : []
            }));
        }

        // Activities
        if (activitiesRecords.length > 0) {
            SITE_CONFIG.island.activities = activitiesRecords.map(a => ({
                title: a.title,
                description: a.description,
                images: a.images ? a.images.map(img => getFileUrl(a, img)) : []
            }));
        }

        // FAQs
        if (faqRecords.length > 0) {
            SITE_CONFIG.faq = faqRecords.map(f => ({
                question: f.question,
                answer: f.answer
            }));
        }

        console.log("✅ CMS Data received and mapped.");

    } catch (error) {
        console.warn("⚠️ Could not load data from CMS. Using local config.", error);
    }
}

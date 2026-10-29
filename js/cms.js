// Auto-detect PocketBase URL
export const PB_URL = window.location.origin;

// Export an initially empty config object
export const SITE_CONFIG = {};

/**
 * Helper to safely fetch a single record from a collection
 */
async function fetchSingle(collectionName) {
    try {
        const response = await fetch(`${PB_URL}/api/collections/${collectionName}/records?perPage=1&sort=-created`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.items && data.items.length > 0 ? data.items[0] : null;
    } catch (e) {
        console.warn(`Failed to fetch ${collectionName}`, e);
        return null;
    }
}

/**
 * Helper to safely fetch a list of records
 */
async function fetchList(collectionName, sort = '-created') {
    try {
        const response = await fetch(`${PB_URL}/api/collections/${collectionName}/records?sort=${sort}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.items || [];
    } catch (e) {
        console.warn(`Failed to fetch ${collectionName}`, e);
        return [];
    }
}

/**
 * Helper to get file URL
 */
const getFileUrl = (record, filename) => {
    if (!record || !filename) return "";
    return `${PB_URL}/api/files/${record.collectionId}/${record.id}/${filename}`;
};

/**
 * Returns a resized version of a PocketBase image (size declared in the migrations: 160x120).
 * PocketBase serves the original for undeclared sizes.
 */
export const thumbUrl = (url, size) => {
    if (!url || !url.includes("/api/files/")) return url;
    return `${url}${url.includes("?") ? "&" : "?"}thumb=${size}`;
};

/**
 * Initialize the CMS connection and update the SITE_CONFIG
 */
const SINGLES = ['site_identity', 'welcome', 'house_config', 'activities_config', 'contact', 'location', 'pricing_config'];
const LISTS = [
    ['pricing_periods', 'start'],
    ['house_features', 'order'],
    ['activities', 'order'],
    ['faq', 'order'],
    // Optional collections (added later): an empty list when missing
    ['stay_rules', 'created'],
    ['booking_options', 'order'],
    ['hero_slides', 'order'],
    ['reviews', '-date'],
    ['pages', 'title']
];

/**
 * All the site content: { site_identity: record | null, …, house_features: [records], … }.
 * Inlined in the page by pb_hooks/seo.pb.js; otherwise one request to /api/site,
 * and as a last resort one request per collection.
 */
async function loadRecords() {
    const inline = document.getElementById("site-data");
    if (inline) {
        try {
            return JSON.parse(inline.textContent);
        } catch (e) {
            console.warn("Invalid inline site data", e);
        }
    }

    try {
        const response = await fetch(`${PB_URL}/api/site`);
        if (response.ok) return await response.json();
    } catch (e) {
        console.warn("Failed to fetch /api/site", e);
    }

    const [singles, lists] = await Promise.all([
        Promise.all(SINGLES.map((name) => fetchSingle(name))),
        Promise.all(LISTS.map(([name, sort]) => fetchList(name, sort)))
    ]);
    const data = {};
    SINGLES.forEach((name, i) => { data[name] = singles[i]; });
    LISTS.forEach(([name], i) => { data[name] = lists[i]; });
    return data;
}

export async function initCMS() {
    try {
        console.log("🔌 Connecting to PocketBase...");

        const data = await loadRecords();
        const identityRecord = data.site_identity;
        const welcomeRecord = data.welcome;
        const houseConfigRecord = data.house_config;
        const activitiesConfigRecord = data.activities_config;
        const contactRecord = data.contact;
        const locationRecord = data.location;
        const pricingConfigRecord = data.pricing_config;
        const pricingPeriodsRecords = data.pricing_periods;
        const featuresRecords = data.house_features;
        const activitiesRecords = data.activities;
        const faqRecords = data.faq;
        const stayRulesRecords = data.stay_rules;
        const bookingOptionsRecords = data.booking_options;
        const heroSlidesRecords = data.hero_slides;

        // Populate SITE_CONFIG based on fetched data

        // 1. Identity & Labels
        if (identityRecord) {
            SITE_CONFIG.identity = {
                name: identityRecord.name,
                tagline: identityRecord.tagline,
                description: identityRecord.description,
            };
            if (identityRecord.labels) SITE_CONFIG.labels = identityRecord.labels;
            
            // Handle Favicon
            if (identityRecord.favicon) {
                const faviconUrl = getFileUrl(identityRecord, identityRecord.favicon);
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
        }

        // 2. Welcome
        if (welcomeRecord) {
            SITE_CONFIG.welcome = {
                title: welcomeRecord.title,
                subtitle: welcomeRecord.subtitle,
                image: getFileUrl(welcomeRecord, welcomeRecord.image)
            };
        }

        // Visual settings (e.g. { "theme": "pavillons" })
        SITE_CONFIG.display = welcomeRecord?.display_options || {};

        // 3. House Config
        if (houseConfigRecord) {
            SITE_CONFIG.house_config = {
                title: houseConfigRecord.title,
                subtitle: houseConfigRecord.subtitle,
                amenities: houseConfigRecord.amenities || [],
                maxGuests: houseConfigRecord.max_guests || null
            };
        }

        // 4. Activities Config
        if (activitiesConfigRecord) {
            SITE_CONFIG.activities_config = {
                title: activitiesConfigRecord.title,
                subtitle: activitiesConfigRecord.subtitle
            };
        }

        // 5. Contact
        if (contactRecord) {
            SITE_CONFIG.contact = {
                email: contactRecord.email,
                phone: contactRecord.phone,
                name: contactRecord.name
                // airbnbUrl is private (hidden field): the iCal proxy reads it server-side
            };

        }

        // 6. Location
        if (locationRecord) {
            SITE_CONFIG.location = {
                lat: locationRecord.lat,
                lng: locationRecord.lng,
                address: locationRecord.address,
                mapZoom: locationRecord.zoom
            };
        }

        // 7. Pricing
        SITE_CONFIG.pricing = {};
        if (pricingConfigRecord) {
            SITE_CONFIG.pricing.cleaningFee = pricingConfigRecord.cleaningFee;
            SITE_CONFIG.pricing.defaultPrice = pricingConfigRecord.defaultPrice;
            SITE_CONFIG.pricing.details = pricingConfigRecord.details;
        }
        if (pricingPeriodsRecords && pricingPeriodsRecords.length > 0) {
            SITE_CONFIG.pricing.periods = pricingPeriodsRecords.map(p => ({
                start: p.start,
                end: p.end,
                price: p.price
            }));
        }

        // 8. House Features
        if (featuresRecords && featuresRecords.length > 0) {
            SITE_CONFIG.house_features = featuresRecords.map(f => ({
                id: f.id,
                title: f.title,
                shortDesc: f.shortDesc,
                fullDesc: f.fullDesc,
                icon: f.icon,
                thumbnail: getFileUrl(f, f.thumbnail),
                gallery: f.gallery ? f.gallery.map(img => getFileUrl(f, img)) : []
            }));
        }

        // 9. Activities
        if (activitiesRecords && activitiesRecords.length > 0) {
            SITE_CONFIG.activities = activitiesRecords.map(a => ({
                title: a.title,
                description: a.description,
                images: a.images ? a.images.map(img => getFileUrl(a, img)) : []
            }));
        }

        // 10. FAQ
        if (faqRecords && faqRecords.length > 0) {
            SITE_CONFIG.faq = faqRecords.map(f => ({
                question: f.question,
                answer: f.answer
            }));
        }

        // 11. Stay rules (e.g. fortnight only in summer)
        SITE_CONFIG.stayRules = (stayRulesRecords || []).map(r => ({
            label: r.label,
            start: r.start,
            end: r.end,
            minNights: r.min_nights || null,
            nightsMultiple: r.nights_multiple || null
        }));

        // 12. Booking options (e.g. linen)
        SITE_CONFIG.bookingOptions = (bookingOptionsRecords || []).map(o => ({
            id: o.id,
            name: o.name,
            description: o.description,
            price: o.price,
            unit: o.unit
        }));

        // 13. Mobile hero photos (full-screen stories)
        SITE_CONFIG.heroSlides = (heroSlidesRecords || [])
            .filter(s => s.image)
            .map(s => ({
                src: getFileUrl(s, s.image),
                caption: s.caption || ""
            }));

        // 14. Guest reviews, newest stay first
        SITE_CONFIG.reviews = (data.reviews || [])
            .filter(r => r.author && r.text)
            .map(r => ({
                author: r.author,
                text: r.text,
                rating: r.rating || null,
                date: r.date,
                source: r.source
            }));

        // 15. Published pages (legal notice, privacy policy), linked from the footer
        SITE_CONFIG.pages = (data.pages || []).map(p => ({ slug: p.slug, title: p.title }));

        console.log("✅ CMS Data received and mapped.");

    } catch (error) {
        console.error("❌ Critical Error loading CMS data:", error);
    }
}

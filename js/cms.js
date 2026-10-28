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
export async function initCMS() {
    try {
        console.log("🔌 Connecting to PocketBase...");

        // Concurrent fetching for better performance
        const [
            identityRecord,
            welcomeRecord,
            houseConfigRecord,
            activitiesConfigRecord,
            contactRecord,
            locationRecord,
            pricingConfigRecord,
            pricingPeriodsRecords,
            featuresRecords,
            activitiesRecords,
            faqRecords,
            stayRulesRecords,
            bookingOptionsRecords,
            heroSlidesRecords
        ] = await Promise.all([
            fetchSingle('site_identity'),
            fetchSingle('welcome'),
            fetchSingle('house_config'),
            fetchSingle('activities_config'),
            fetchSingle('contact'),
            fetchSingle('location'),
            fetchSingle('pricing_config'),
            fetchList('pricing_periods', 'start'),
            fetchList('house_features', 'order'),
            fetchList('activities', 'order'),
            fetchList('faq', 'order'),
            // Optional collections (added later): an empty list when missing
            fetchList('stay_rules', 'created'),
            fetchList('booking_options', 'order'),
            fetchList('hero_slides', 'order')
        ]);

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

        console.log("✅ CMS Data received and mapped.");

    } catch (error) {
        console.error("❌ Critical Error loading CMS data:", error);
    }
}

/**
 * Public site content, read in one go from the collections displayed by the front-end (js/cms.js).
 * Same records as the public API: the export leaves out hidden fields (contact.airbnbUrl).
 * Cached in the app store, cleared whenever one of these collections changes (pb_hooks/seo.pb.js).
 */

const SINGLES = ["site_identity", "welcome", "house_config", "activities_config", "contact", "location", "pricing_config"];

// Collection → sort
const LISTS = {
    pricing_periods: "start",
    house_features: "order",
    activities: "order",
    faq: "order",
    stay_rules: "created",
    booking_options: "order",
    hero_slides: "order",
};

const COLLECTIONS = SINGLES.concat(Object.keys(LISTS), ["pages"]);
const CACHE_KEYS = ["site_data", "seo_home", "seo_sitemap"];

function exportRecords(app, name, sort, limit, filter) {
    try {
        return app.findRecordsByFilter(name, filter || "id != ''", sort, limit, 0)
            .map((record) => JSON.parse(JSON.stringify(record)));
    } catch (e) {
        return []; // optional collection not created yet
    }
}

/** { site_identity: {...} | null, …, house_features: [...], pages: [{ slug, title, updated }] } */
function loadSiteData(app) {
    const cached = app.store().get("site_data");
    if (cached) return JSON.parse(cached);

    const data = {};
    SINGLES.forEach((name) => {
        data[name] = exportRecords(app, name, "-created", 1)[0] || null;
    });
    Object.keys(LISTS).forEach((name) => {
        data[name] = exportRecords(app, name, LISTS[name], 0);
    });
    data.pages = exportRecords(app, "pages", "title", 0, "published = true")
        .map((page) => ({ slug: page.slug, title: page.title, updated: page.updated }));

    app.store().set("site_data", JSON.stringify(data));
    return data;
}

function clearCache(app) {
    CACHE_KEYS.forEach((key) => app.store().remove(key));
}

module.exports = { COLLECTIONS, loadSiteData, clearCache };

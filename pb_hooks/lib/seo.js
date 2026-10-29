/**
 * Server-side SEO. The site is rendered in the browser from the CMS: without this, search engines
 * and AI crawlers (which do not run JavaScript) receive an empty page.
 * - the home page gets the CMS content as plain HTML inside <app-root>, replaced by the theme
 *   once js/app.js starts (same content, shown only if the app does not start, see .seo-fallback)
 * - the head gets the favicon, the share image, font preloads and the structured data (JSON-LD)
 * - the CMS data is inlined, so js/cms.js does not have to fetch it
 * Also renders the sitemap and the legal pages.
 */

const { loadSiteData } = require(`${__hooks}/lib/site.js`);

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const LEGAL_SLUGS = ["mentions-legales", "confidentialite"];

// Fonts used above the fold, per theme (see css/themes/fonts-*.css). Default theme: js/theme.js
const THEME_FONTS = {
    pavillons: ["fraunces-latin-opsz-normal.woff2", "inter-latin-wght-normal.woff2"],
    classic: ["playfair-display-latin-wght-normal.woff2", "lato-latin-400-normal.woff2"],
};
const DEFAULT_THEME = "classic";

// Google's vacation rental amenity names, matched on the free-text amenities
const AMENITIES = [
    [/wifi|internet|fibre/i, "wifi"],
    [/cuisine/i, "kitchen"],
    [/lit (bébé|parapluie)|berceau/i, "crib"],
    [/terrasse/i, "patio"],
    [/barbecue|plancha/i, "outdoorGrill"],
    [/\btv\b|télé/i, "tv"],
    [/lave-linge|machine à laver/i, "washerDryer"],
    [/climatisation|\bclim\b/i, "ac"],
    [/piscine/i, "pool"],
];

const ENTITIES = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
    laquo: "«", raquo: "»", hellip: "…", ndash: "–", mdash: "—", euro: "€", deg: "°", times: "×", middot: "·",
    agrave: "à", acirc: "â", auml: "ä", ccedil: "ç", egrave: "è", eacute: "é", ecirc: "ê", euml: "ë", icirc: "î",
    iuml: "ï", ocirc: "ô", ouml: "ö", ugrave: "ù", ucirc: "û", uuml: "ü", oelig: "œ", Agrave: "À", Acirc: "Â",
    Ccedil: "Ç", Egrave: "È", Eacute: "É", Ecirc: "Ê", Icirc: "Î", Ocirc: "Ô", Ugrave: "Ù", Ucirc: "Û", OElig: "Œ",
};

// --- Text helpers ---

const env = (name) => ($os.getenv(name) || "").trim();

const esc = (value) => String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function decodeEntities(text) {
    return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, code) => {
        if (code[0] === "#") {
            const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
            return n ? String.fromCodePoint(n) : match;
        }
        return ENTITIES[code] !== undefined ? ENTITIES[code] : match;
    });
}

/** Rich text (editor fields) → paragraphs of plain text. */
function paragraphs(html) {
    return String(html || "")
        .replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .split(/\n+/)
        .map((line) => decodeEntities(line).replace(/\s+/g, " ").trim())
        .filter(Boolean);
}

const plainText = (html) => paragraphs(html).join(" ");
const htmlParagraphs = (html) => paragraphs(html).map((p) => `<p>${esc(p)}</p>`).join("");

const fmtPrice = (amount) => `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} €`;

/** "26/06" → { day: 26, month: 6 } */
function parseDay(str) {
    const [day, month] = String(str || "").split("/").map((n) => parseInt(n, 10));
    return { day, month };
}

const fmtDay = (str) => {
    const { day, month } = parseDay(str);
    return day && month ? `${day === 1 ? "1er" : day} ${MONTHS[month - 1]}` : str;
};

/** "2025-07-14 00:00:00.000Z" → "juillet 2025" */
const monthYear = (value) => {
    const match = /^(\d{4})-(\d{2})/.exec(value || "");
    return match ? `${MONTHS[parseInt(match[2], 10) - 1]} ${match[1]}` : "";
};

const dayKey = (str) => {
    const { day, month } = parseDay(str);
    return (month || 0) * 100 + (day || 0);
};

// --- URLs ---

/** Public site URL with a trailing slash: SEO_URL, or the request's own origin. */
function siteUrl(e) {
    const fromEnv = env("SEO_URL");
    if (fromEnv) return fromEnv.replace(/\/?$/, "/");
    const proto = e.request.header.get("X-Forwarded-Proto") || (e.request.tls ? "https" : "http");
    return `${proto}://${e.request.host}/`;
}

const fileUrl = (base, record, filename, thumb) => filename
    ? `${base}api/files/${record.collectionId}/${record.id}/${encodeURIComponent(filename)}${thumb ? `?thumb=${thumb}` : ""}`
    : "";

/** An env path ("img/bg.png") made absolute. */
const envUrl = (base, value) => !value ? "" : /^https?:/.test(value) ? value : base + value.replace(/^\.?\//, "");

// --- Facts shared by the page, the structured data and the sitemap ---

function facts(data, base) {
    const identity = data.site_identity || {};
    const welcome = data.welcome || {};
    const house = data.house_config || {};
    const location = data.location || {};
    const pricing = data.pricing_config || {};
    const labels = identity.labels || {};

    const name = identity.name || env("SEO_TITLE");
    const heading = welcome.subtitle ? `${welcome.title} – ${welcome.subtitle}` : welcome.title || name;

    // "91 chemin du Roh Vras<br> 56780 Île-aux-Moines"
    const addressLines = paragraphs(location.address);
    const cityLine = addressLines.length > 1 ? addressLines[addressLines.length - 1].match(/^(\d{5})\s+(.+)$/) : null;
    const address = {
        street: cityLine ? addressLines.slice(0, -1).join(", ") : env("SEO_ADDRESS_STREET"),
        zip: cityLine ? cityLine[1] : env("SEO_ADDRESS_ZIP"),
        locality: cityLine ? cityLine[2] : env("SEO_ADDRESS_LOCALITY"),
    };

    const periods = (data.pricing_periods || []).slice().sort((a, b) => dayKey(a.start) - dayKey(b.start));
    const prices = [pricing.defaultPrice].concat(periods.map((p) => p.price)).filter((p) => p > 0);

    const images = [];
    const addImage = (record, filename) => {
        const url = fileUrl(base, record, filename);
        if (url && images.indexOf(url) === -1) images.push(url);
    };
    (data.hero_slides || []).forEach((slide) => addImage(slide, slide.image));
    addImage(welcome, welcome.image);
    (data.house_features || []).forEach((feature) => {
        addImage(feature, feature.thumbnail);
        (feature.gallery || []).forEach((file) => addImage(feature, file));
    });
    (data.activities || []).forEach((activity) => (activity.images || []).forEach((file) => addImage(activity, file)));

    const firstSlide = (data.hero_slides || [])[0];
    let shareImage = null;
    if (firstSlide) shareImage = { url: fileUrl(base, firstSlide, firstSlide.image, "1200x630"), alt: firstSlide.caption, sized: true };
    else if (welcome.image) shareImage = { url: fileUrl(base, welcome, welcome.image, "1200x630"), alt: welcome.title, sized: true };
    else if (env("SEO_IMAGE")) shareImage = { url: envUrl(base, env("SEO_IMAGE")), alt: name, sized: false };

    return {
        identity, welcome, house, location, pricing, labels, name, heading, address, periods, images, shareImage,
        description: env("SEO_DESCRIPTION") || plainText(identity.description),
        favicon: identity.favicon ? fileUrl(base, identity, identity.favicon) : envUrl(base, env("SEO_FAVICON")),
        appleTouchIcon: fileUrl(base, identity, identity.apple_touch_icon),
        priceRange: prices.length
            ? (Math.min.apply(null, prices) === Math.max.apply(null, prices)
                ? `${fmtPrice(prices[0])} / nuit`
                : `${fmtPrice(Math.min.apply(null, prices))} – ${fmtPrice(Math.max.apply(null, prices))} / nuit`)
            : env("SEO_PRICE_RANGE"),
    };
}

/** "07 88 45 29 74" → "+33 7 88 45 29 74" (French numbers), anything else unchanged. */
function intlPhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!/^0[1-9]\d{8}$/.test(digits)) return phone || "";
    return `+33 ${digits[1]} ${digits.slice(2).match(/\d{2}/g).join(" ")}`;
}

// --- Structured data ---

function structuredData(data, f, base) {
    const house = f.house;
    const amenities = house.amenities || [];
    const lat = f.location.lat || parseFloat(env("SEO_LAT"));
    const lng = f.location.lng || parseFloat(env("SEO_LNG"));
    const phone = intlPhone((data.contact || {}).phone || env("SEO_PHONE"));
    const links = (Array.isArray(f.identity.external_links) ? f.identity.external_links : [])
        .filter((url) => typeof url === "string" && /^https?:\/\//.test(url));
    const time = (value) => /^\d{2}:\d{2}$/.test(value || "") ? `${value}:00` : undefined;

    const accommodation = {
        "@type": "Accommodation",
        additionalType: "EntirePlace",
        occupancy: house.max_guests ? { "@type": "QuantitativeValue", maxValue: house.max_guests } : undefined,
        numberOfBedrooms: house.bedrooms || undefined,
        numberOfBathroomsTotal: house.bathrooms || undefined,
        amenityFeature: AMENITIES
            .filter(([pattern]) => amenities.some((label) => pattern.test(label)))
            .map(([, amenity]) => ({ "@type": "LocationFeatureSpecification", name: amenity, value: true })),
    };
    if (!accommodation.amenityFeature.length) delete accommodation.amenityFeature;

    const rental = {
        "@context": "https://schema.org",
        "@type": "VacationRental",
        "@id": `${base}#location`,
        identifier: house.id || undefined,
        name: f.name,
        description: f.description || undefined,
        url: base,
        image: f.images.slice(0, 12),
        address: f.address.locality ? {
            "@type": "PostalAddress",
            streetAddress: f.address.street || undefined,
            postalCode: f.address.zip || undefined,
            addressLocality: f.address.locality,
            addressCountry: "FR",
        } : undefined,
        latitude: lat || undefined,
        longitude: lng || undefined,
        telephone: phone || undefined,
        priceRange: f.priceRange || undefined,
        checkinTime: time(house.checkin_time),
        checkoutTime: time(house.checkout_time),
        knowsLanguage: ["fr"],
        sameAs: links.length ? links : undefined,
        containsPlace: accommodation,
    };

    const faq = (data.faq || []).filter((item) => item.question && item.answer);
    const faqPage = faq.length ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.question.trim(),
            acceptedAnswer: { "@type": "Answer", text: plainText(item.answer) },
        })),
    } : null;

    return [rental, faqPage].filter(Boolean);
}

const jsonScript = (type, value, id) =>
    `<script type="${type}"${id ? ` id="${id}"` : ""}>${JSON.stringify(value).replace(/</g, "\\u003c")}</script>`;

// --- Home page ---

function headTags(data, f, base) {
    const display = (data.welcome || {}).display_options || {};
    const fonts = THEME_FONTS[display.theme] || THEME_FONTS[DEFAULT_THEME];
    const tags = [`<meta property="og:site_name" content="${esc(f.name)}" />`];

    if (f.favicon) tags.push(`<link rel="icon" href="${esc(f.favicon)}" />`);
    if (f.appleTouchIcon) tags.push(`<link rel="apple-touch-icon" href="${esc(f.appleTouchIcon)}" />`);
    if (f.shareImage) {
        tags.push(`<meta property="og:image" content="${esc(f.shareImage.url)}" />`);
        if (f.shareImage.sized) tags.push('<meta property="og:image:width" content="1200" />', '<meta property="og:image:height" content="630" />');
        if (f.shareImage.alt) tags.push(`<meta property="og:image:alt" content="${esc(f.shareImage.alt)}" />`);
        tags.push(`<meta name="twitter:image" content="${esc(f.shareImage.url)}" />`);
    }
    fonts.forEach((font) => tags.push(`<link rel="preload" href="css/vendor/fonts/${font}" as="font" type="font/woff2" crossorigin />`));
    structuredData(data, f, base).forEach((item) => tags.push(jsonScript("application/ld+json", item)));

    return tags.join("\n        ");
}

const list = (items) => items.length ? `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : "";

function stayRuleText(rule) {
    let text = rule.label;
    if (!text) {
        const parts = [];
        if (rule.nights_multiple) parts.push(`séjours par multiples de ${rule.nights_multiple} nuits`);
        if (rule.min_nights) parts.push(`${rule.min_nights} nuits minimum`);
        text = parts.join(", ");
    }
    return `Du ${fmtDay(rule.start)} au ${fmtDay(rule.end)} : ${text}`;
}

const OPTION_UNITS = { stay: "par séjour", night: "par nuit", guest: "par personne", guest_night: "par personne et par nuit" };

/** The CMS content as plain, readable HTML (the same content the theme displays). */
function contentHtml(data, f) {
    const { labels, house, pricing } = f;
    const activitiesConfig = data.activities_config || {};
    const contact = data.contact || {};
    const map = labels.map || {};
    const sections = [];

    sections.push(`
        <h1>${esc(f.heading)}</h1>
        ${htmlParagraphs(f.identity.description)}
        ${list((labels.hero && labels.hero.facts) || [])}`);

    if ((data.house_features || []).length || (house.amenities || []).length) {
        sections.push(`
        <section>
            <h2>${esc(house.title || "La maison")}</h2>
            ${house.subtitle ? `<p>${esc(house.subtitle)}</p>` : ""}
            ${list(house.amenities || [])}
            ${(data.house_features || []).map((feature) => `
            <h3>${esc(feature.title)}</h3>
            ${feature.shortDesc ? `<p>${esc(feature.shortDesc)}</p>` : ""}
            ${htmlParagraphs(feature.fullDesc)}`).join("")}
        </section>`);
    }

    if ((data.activities || []).length) {
        sections.push(`
        <section>
            <h2>${esc(activitiesConfig.title || "À découvrir")}</h2>
            ${activitiesConfig.subtitle ? `<p>${esc(activitiesConfig.subtitle)}</p>` : ""}
            ${data.activities.map((activity) => `
            <h3>${esc(activity.title)}</h3>
            ${htmlParagraphs(activity.description)}`).join("")}
        </section>`);
    }

    const rows = f.periods.map((p) => `<tr><td>Du ${esc(fmtDay(p.start))} au ${esc(fmtDay(p.end))}</td><td>${esc(fmtPrice(p.price))}</td></tr>`);
    if (pricing.defaultPrice) rows.push(`<tr><td>${f.periods.length ? "Autres dates" : "Toute l'année"}</td><td>${esc(fmtPrice(pricing.defaultPrice))}</td></tr>`);
    const details = (pricing.details || []).concat(
        (data.stay_rules || []).map(stayRuleText),
        (data.booking_options || []).map((o) => `${o.name} : ${fmtPrice(o.price)} ${OPTION_UNITS[o.unit] || ""}`.trim()),
    );
    if (rows.length || details.length) {
        sections.push(`
        <section>
            <h2>${esc((labels.pricing && labels.pricing.title) || "Tarifs")}</h2>
            ${rows.length ? `<table><thead><tr><th>Période</th><th>Prix par nuit</th></tr></thead><tbody>${rows.join("")}</tbody></table>` : ""}
            ${list(details)}
        </section>`);
    }

    if (f.location.address) {
        sections.push(`
        <section>
            <h2>${esc(map.title || "Situation")}</h2>
            ${map.subtitle ? `<p>${esc(map.subtitle)}</p>` : ""}
            <p>${paragraphs(f.location.address).map(esc).join("<br>")}</p>
            ${list(map.nearbyList || [])}
        </section>`);
    }

    const reviews = (data.reviews || []).filter((review) => review.author && review.text);
    if (reviews.length) {
        sections.push(`
        <section>
            <h2>${esc((labels.reviews && labels.reviews.title) || "Avis de nos voyageurs")}</h2>
            ${reviews.map((review) => {
                const meta = [review.author, monthYear(review.date), review.source, review.rating ? `${review.rating}/5` : ""].filter(Boolean);
                return `
            <figure><blockquote>${htmlParagraphs(review.text)}</blockquote><figcaption>${esc(meta.join(" · "))}</figcaption></figure>`;
            }).join("")}
        </section>`);
    }

    if ((data.faq || []).length) {
        sections.push(`
        <section>
            <h2>${esc((labels.faq && labels.faq.title) || "Questions fréquentes")}</h2>
            ${data.faq.map((item) => `
            <h3>${esc(item.question)}</h3>
            ${htmlParagraphs(item.answer)}`).join("")}
        </section>`);
    }

    if (contact.phone || contact.email) {
        const phoneHref = String(contact.phone || "").replace(/\s/g, "");
        sections.push(`
        <section>
            <h2>${esc((labels.contact && labels.contact.title) || "Contact")}</h2>
            ${contact.name ? `<p>${esc(contact.name)}</p>` : ""}
            ${contact.phone ? `<p>Téléphone : <a href="tel:${esc(phoneHref)}">${esc(contact.phone)}</a></p>` : ""}
            ${contact.email ? `<p>Email : <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></p>` : ""}
        </section>`);
    }

    const pages = (data.pages || []).filter((page) => LEGAL_SLUGS.indexOf(page.slug) !== -1);
    return `<div class="seo-fallback">
        <p><a href="/">${esc(f.name)}</a></p>
        <main>${sections.join("")}
        </main>
        ${pages.length ? `<footer><p>${pages.map((page) => `<a href="/${page.slug}">${esc(page.title)}</a>`).join(" · ")}</p></footer>` : ""}
    </div>`;
}

function readIndex() {
    return toString($os.readFile(`${__hooks}/../pb_public/index.html`));
}

/** The home page with the CMS content, cached until the content changes. */
function homePage(app, base) {
    const cached = app.store().get("seo_home");
    if (cached) return cached;

    const data = loadSiteData(app);
    const f = facts(data, base);
    const html = readIndex()
        .replace(/<!-- seo:head[^>]*-->/, headTags(data, f, base))
        .replace("<app-root></app-root>", () => `<app-root>${contentHtml(data, f)}</app-root>\n        ${jsonScript("application/json", data, "site-data")}`);

    app.store().set("seo_home", html);
    return html;
}

// --- Other routes ---

const isoDate = (value) => String(value || "").slice(0, 10);

function sitemap(app, base) {
    const cached = app.store().get("seo_sitemap");
    if (cached) return cached;

    const data = loadSiteData(app);
    const f = facts(data, base);
    let lastmod = "";
    Object.keys(data).forEach((key) => {
        [].concat(data[key] || []).forEach((record) => {
            if (record && record.updated && isoDate(record.updated) > lastmod) lastmod = isoDate(record.updated);
        });
    });

    const xmlEsc = (value) => esc(value).replace(/'/g, "&apos;");
    const pages = (data.pages || []).filter((page) => LEGAL_SLUGS.indexOf(page.slug) !== -1);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url>
        <loc>${xmlEsc(base)}</loc>${lastmod ? `
        <lastmod>${lastmod}</lastmod>` : ""}${f.images.map((url) => `
        <image:image><image:loc>${xmlEsc(url)}</image:loc></image:image>`).join("")}
    </url>${pages.map((page) => `
    <url>
        <loc>${xmlEsc(base + page.slug)}</loc>
        <lastmod>${isoDate(page.updated)}</lastmod>
    </url>`).join("")}
</urlset>
`;
    app.store().set("seo_sitemap", xml);
    return xml;
}

function faviconUrl(app, base) {
    return facts(loadSiteData(app), base).favicon;
}

function appleTouchIconUrl(app, base) {
    return facts(loadSiteData(app), base).appleTouchIcon;
}

/** Published legal page, or null. */
function legalPage(app, base, slug) {
    let page;
    try {
        page = app.findFirstRecordByFilter("pages", "slug = {:slug} && published = true", { slug });
    } catch (e) {
        return null;
    }

    const data = loadSiteData(app);
    const f = facts(data, base);
    const title = page.getString("title");
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)} · ${esc(f.name)}</title>
    <link rel="canonical" href="${esc(base + slug)}" />
    ${f.favicon ? `<link rel="icon" href="${esc(f.favicon)}" />` : ""}
    ${f.appleTouchIcon ? `<link rel="apple-touch-icon" href="${esc(f.appleTouchIcon)}" />` : ""}
    <link rel="stylesheet" href="/css/page.css" />
</head>
<body>
    <header><a href="/">← ${esc(f.name)}</a></header>
    <main>
        <h1>${esc(title)}</h1>
        ${page.getString("content")}
    </main>
</body>
</html>`;
}

/** Small HTML page for unknown paths (instead of PocketBase's JSON error). */
function notFoundPage(app, base) {
    let name = env("SEO_TITLE");
    try {
        name = facts(loadSiteData(app), base).name || name;
    } catch (e) {
        // keep the env name
    }
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Page introuvable · ${esc(name)}</title>
    <link rel="stylesheet" href="/css/page.css" />
</head>
<body>
    <main>
        <h1>Page introuvable</h1>
        <p>Cette adresse n'existe pas ou plus.</p>
        <p><a href="/">Retour à l'accueil de ${esc(name)}</a></p>
    </main>
</body>
</html>`;
}

module.exports = { LEGAL_SLUGS, siteUrl, homePage, sitemap, faviconUrl, appleTouchIconUrl, legalPage, notFoundPage, decodeEntities, paragraphs };

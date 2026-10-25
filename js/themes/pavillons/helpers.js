/**
 * PAVILLONS — formatting, markup and motion helpers shared by the theme's components.
 */
import { parsePeriodDay } from "../../utils/BookingUtils.js";
import { thumbUrl } from "../../cms.js";

/** 160×120 preview for thumbnail strips (much lighter than the original photo). */
export const previewUrl = (url) => thumbUrl(url, "160x120");

// Signal flags K, I and M (decorative)
export const FLAGS = `
    <svg class="pav-flag" viewBox="0 0 36 36" aria-hidden="true"><rect width="18" height="36" fill="#F2C230"/><rect x="18" width="18" height="36" fill="#1D4FA0"/></svg>
    <svg class="pav-flag" viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" fill="#F2C230"/><circle cx="18" cy="18" r="8" fill="#0C1823"/></svg>
    <svg class="pav-flag" viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" fill="#1D4FA0"/><path d="M0 0L36 36M36 0L0 36" stroke="#FFFFFF" stroke-width="7"/></svg>
`;

const shortDate = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const longDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const shortMonth = new Intl.DateTimeFormat("fr-FR", { month: "short" });

export const fmtPrice = (amount) => `${Number(amount).toLocaleString("fr-FR")} €`;
export const fmtShortDate = (date) => shortDate.format(date);
export const fmtLongDate = (date) => longDate.format(date);

/** "01/07" → "1 juil." */
export function fmtPeriodDay(str) {
    const { day, month } = parsePeriodDay(str);
    return `${day} ${shortMonth.format(new Date(2023, month - 1, 1))}`;
}

/** "Du 12 juil. au 23 août : location à la quinzaine (14, 28… nuits)" */
export function ruleText(rule) {
    let text = rule.label;
    if (!text) {
        const parts = [];
        if (rule.nightsMultiple) parts.push(`séjours par multiples de ${rule.nightsMultiple} nuits`);
        if (rule.minNights) parts.push(`${rule.minNights} nuits minimum`);
        text = parts.join(", ");
    }
    return `Du ${fmtPeriodDay(rule.start)} au ${fmtPeriodDay(rule.end)} : ${text}`;
}

const OPTION_UNITS = { stay: "/ séjour", night: "/ nuit", guest: "/ pers.", guest_night: "/ pers. / nuit" };

/** "15 € / pers." */
export const fmtOptionPrice = (option) => `${fmtPrice(option.price)} ${OPTION_UNITS[option.unit] || ""}`.trim();

/** Lowest nightly price across the default price and the seasonal periods. */
export function minNightlyPrice(pricing = {}) {
    const prices = [pricing.defaultPrice, ...(pricing.periods || []).map((p) => p.price)]
        .filter((p) => Number.isFinite(p));
    return prices.length ? Math.min(...prices) : null;
}

const AMENITY_ICONS = [
    [/personne|voyageur|couchage/i, "users"],
    [/bain|douche/i, "bath"],
    [/chambre|\blits?\b/i, "bed-double"],
    [/wifi|internet|fibre|tv/i, "wifi"],
    [/cuisine|vaisselle/i, "chef-hat"],
    [/terrasse|jardin|extérieur/i, "sun"],
    [/piscine/i, "waves"],
    [/parking|garage/i, "car"],
    [/clim/i, "snowflake"],
];

/** Picks a Lucide icon for a free-text amenity (house_config.amenities). */
export function amenityIcon(label) {
    const match = AMENITY_ICONS.find(([pattern]) => pattern.test(label));
    return match ? match[1] : "check";
}

/** Numbered section header: "01 · Le Logement" + title. */
export function sectionHeader({ num, eyebrow, title, dark = false }) {
    const tone = dark ? "text-pav-yellow" : "text-pav-blue";
    const badge = dark ? "bg-pav-yellow text-pav-navy" : "bg-pav-blue text-white";
    return `
        <div class="pav-reveal mb-7 md:mb-12">
            <p class="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] md:text-sm ${tone}">
                <span class="pav-num ${badge}">${num}</span>${eyebrow || ""}
            </p>
            <h2 class="pav-h2 mt-4">${title || ""}</h2>
        </div>
    `;
}

let revealObserver;

/** Reveals `.pav-reveal`, `.pav-unveil` and `.pav-wipe` elements as they scroll into view. */
export function observeReveals(root = document) {
    const elements = root.querySelectorAll(".pav-reveal:not(.is-in), .pav-unveil:not(.is-in), .pav-wipe:not(.is-in)");
    if (!document.documentElement.classList.contains("pav-motion") || !("IntersectionObserver" in window)) {
        elements.forEach((el) => el.classList.add("is-in"));
        return;
    }
    revealObserver ??= new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
        }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    elements.forEach((el) => revealObserver.observe(el));
}

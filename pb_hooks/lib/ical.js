/**
 * iCal proxy helpers. Plain CommonJS module: no PocketBase globals,
 * so it can be required from hooks (`require(`${__hooks}/lib/ical.js`)`) and tested with Node.
 */

// airbnb.com, airbnb.fr, airbnb.co.uk, fr.airbnb.ca…
const AIRBNB_HOST = /(^|\.)airbnb(\.[a-z]{2,3}){1,2}$/;

/**
 * Host of an https URL, or "" when the URL is not https or carries credentials ("https://user@host").
 * @param {string} url
 * @returns {string}
 */
function httpsHost(url) {
    const match = /^https:\/\/([^/?#]+)/i.exec(String(url || "").trim());
    if (!match || match[1].indexOf("@") !== -1) return "";
    return match[1].replace(/:\d+$/, "").toLowerCase();
}

/**
 * Whether the calendar URL may be fetched by the proxy: https only, on an Airbnb host
 * or on one of the extra hosts (and their subdomains).
 * @param {string} url
 * @param {string} [extraHosts] - Comma-separated hosts (ICAL_ALLOWED_HOSTS), e.g. "www.abritel.fr".
 * @returns {boolean}
 */
function isAllowedCalendarUrl(url, extraHosts) {
    const host = httpsHost(url);
    if (!host) return false;
    if (AIRBNB_HOST.test(host)) return true;

    return String(extraHosts || "")
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
        .some((h) => host === h || host.endsWith("." + h));
}

module.exports = { isAllowedCalendarUrl };

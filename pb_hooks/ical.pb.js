/// <reference path="../pb_data/types.d.ts" />

/**
 * Airbnb availability for the booking forms, fetched server-side (bypassing CORS).
 * The calendar URL is read from `contact.airbnbUrl`, never from the request, so the route
 * cannot be used to reach other hosts. Extra iCal hosts: ICAL_ALLOWED_HOSTS (comma-separated).
 * The calendar is cached in memory for 10 minutes.
 */
routerAdd("GET", "/api/ical-proxy", (e) => {
    const { isAllowedCalendarUrl } = require(`${__hooks}/lib/ical.js`);
    const CACHE_KEY = "ical_proxy_cache";
    const CACHE_MS = 10 * 60 * 1000;

    let url = "";
    try {
        const contact = $app.findRecordsByFilter("contact", "id != ''", "-created", 1, 0)[0];
        url = contact ? contact.getString("airbnbUrl") : "";
    } catch (err) {
        // collection missing
    }

    if (!url) {
        return e.json(404, { error: "No calendar configured" });
    }
    if (!isAllowedCalendarUrl(url, $os.getenv("ICAL_ALLOWED_HOSTS"))) {
        console.warn(`⚠️ iCal URL rejected (https Airbnb host expected, see ICAL_ALLOWED_HOSTS): ${url}`);
        return e.json(404, { error: "No calendar configured" });
    }

    // Stored as a JSON string: JS objects cannot be shared between hook runtimes
    const cached = JSON.parse($app.store().get(CACHE_KEY) || "null");
    if (cached && cached.url === url && Date.now() - cached.at < CACHE_MS) {
        return e.string(200, cached.body);
    }

    try {
        const res = $http.send({
            url: url,
            method: "GET",
            timeout: 10 // 10 seconds timeout
        });
        const body = toString(res.body);

        if (res.statusCode >= 400 || body.indexOf("BEGIN:VCALENDAR") === -1) {
            console.error(`❌ iCal fetch returned ${res.statusCode} without a calendar`);
            return e.json(502, { error: "Calendar unavailable" });
        }

        $app.store().set(CACHE_KEY, JSON.stringify({ url: url, at: Date.now(), body: body }));
        return e.string(200, body);

    } catch (err) {
        console.error("❌ Failed to fetch iCal:", err);
        return e.json(502, { error: "Calendar unavailable" });
    }
});

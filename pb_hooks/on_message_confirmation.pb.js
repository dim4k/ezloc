/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: Send a confirmation email to the guest after a booking request (via Resend).
 * Skipped when RESEND_API_KEY is missing or RESEND_CONFIRMATION is "false".
 */
onRecordCreateRequest((e) => {
    e.next(); // the record is saved: confirm to the guest

    const apiKey = $os.getenv("RESEND_API_KEY");
    if (!apiKey || $os.getenv("RESEND_CONFIRMATION") === "false") return;

    const record = e.record;
    const to = record.getString("email");
    if (!to) return;

    const { buildConfirmationEmail } = require(`${__hooks}/lib/booking_emails.js`);
    // Singletons (site_identity, contact…): latest record, or null
    const latest = (collection) => {
        try {
            return $app.findRecordsByFilter(collection, "id != ''", "-created", 1, 0)[0] || null;
        } catch (err) {
            return null;
        }
    };
    const parseJson = (value, fallback) => {
        try {
            return JSON.parse(value) || fallback;
        } catch (err) {
            return fallback;
        }
    };

    const identity = latest("site_identity");
    const contact = latest("contact");
    const location = latest("location");
    const pricing = latest("pricing_config");
    const welcome = latest("welcome");

    // Only keep options that really exist (the request payload comes from the browser)
    let knownOptions = [];
    try {
        knownOptions = $app.findRecordsByFilter("booking_options", "id != ''", "order", 100, 0).map((o) => o.getString("name"));
    } catch (err) {
        // collection not created yet
    }
    const options = parseJson(record.getString("options"), [])
        .filter((option) => option && knownOptions.indexOf(option.name) !== -1);

    const appUrl = ($app.settings().meta.appURL || "").replace(/\/$/, "");
    const image = welcome ? welcome.getString("image") : "";
    const lat = location ? location.getFloat("lat") : 0;
    const lng = location ? location.getFloat("lng") : 0;

    const { subject, html } = buildConfirmationEmail({
        siteName: identity ? identity.getString("name") : "",
        ownerName: contact ? contact.getString("name") : "",
        guestName: record.getString("name"),
        arrival: record.getString("arrival"),
        departure: record.getString("departure"),
        guests: record.getInt("guests") || null,
        options: options,
        estimate: record.getString("price_estimation"),
        conditions: pricing ? parseJson(pricing.getString("details"), []) : [],
        address: location ? location.getString("address") : "",
        directionsUrl: lat && lng ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : "",
        phone: contact ? contact.getString("phone") : "",
        imageUrl: appUrl && image ? `${appUrl}/api/files/${welcome.collection().id}/${welcome.id}/${image}?thumb=960x0` : "",
        siteUrl: appUrl.replace(/^https?:\/\//, ""),
    });

    try {
        const res = $http.send({
            url: "https://api.resend.com/emails",
            method: "POST",
            headers: {
                "Authorization": "Bearer " + apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: $os.getenv("RESEND_FROM_EMAIL") || "contact@location-ile-aux-moines.fr",
                to: [to],
                reply_to: (contact && contact.getString("email")) || $os.getenv("RESEND_TO_EMAIL") || undefined,
                subject: subject,
                html: html,
            }),
        });

        if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`✅ Confirmation email sent to ${to}`);
        } else {
            console.error(`❌ Resend API error ${res.statusCode}:`, toString(res.body));
        }
    } catch (err) {
        console.error("❌ Failed to send confirmation email via Resend:", err);
    }
}, "messages");

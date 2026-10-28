/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: Send a confirmation email to the guest after a booking request (via Resend).
 * Skipped when RESEND_API_KEY is missing or RESEND_CONFIRMATION is "false".
 * At most one confirmation per address every 24 h, so the form cannot be used to flood a mailbox.
 */
onRecordCreateRequest((e) => {
    e.next(); // the record is saved: confirm to the guest

    const apiKey = $os.getenv("RESEND_API_KEY");
    if (!apiKey || $os.getenv("RESEND_CONFIRMATION") === "false") return;

    const record = e.record;
    if (record.isNew()) return; // not saved (stopped by another hook)
    const to = record.getString("email");
    if (!to) return;

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString().replace("T", " ");
    const earlier = $app.countRecords(
        "messages",
        $dbx.exp("LOWER([[email]]) = {:email} AND [[created]] > {:since} AND [[id]] != {:id}", { email: to.toLowerCase(), since: since, id: record.id }),
    );
    if (earlier > 0) {
        console.log(`ℹ️ Confirmation already sent to ${to} in the last 24 h, skipped`);
        return;
    }

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

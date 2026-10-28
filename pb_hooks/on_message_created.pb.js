/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: Send email notification via Resend API when a new contact message is created.
 */
onRecordCreateRequest((e) => {
    e.next(); // the record is saved: notify the owner

    const record = e.record;
    if (record.isNew()) return; // not saved (stopped by another hook)

    const apiKey = $os.getenv("RESEND_API_KEY");
    if (!apiKey) {
        console.warn("⚠️ RESEND_API_KEY is not set. Skipping email notification.");
        return;
    }

    const toEmail = $os.getenv("RESEND_TO_EMAIL");
    if (!toEmail) {
        console.warn("⚠️ RESEND_TO_EMAIL is not set. Skipping email notification.");
        return;
    }

    const { buildNotificationEmail } = require(`${__hooks}/lib/booking_emails.js`);

    // Optional fields (migrations 1792966000 and 1793100000): guests, selected options and phone
    let options = [];
    try {
        options = JSON.parse(record.getString("options") || "[]") || [];
    } catch (err) {
        options = [];
    }

    const name = record.getString("name");
    const email = record.getString("email");
    const { subject, html } = buildNotificationEmail({
        name: name,
        email: email,
        arrival: record.getString("arrival"),
        departure: record.getString("departure"),
        message: record.getString("message"),
        estimate: record.getString("price_estimation"),
        phone: record.getString("phone"),
        guests: record.getInt("guests") || null,
        options: options,
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
                from: "contact@location-ile-aux-moines.fr",
                to: [toEmail],
                reply_to: email,
                subject: subject,
                html: html,
            }),
        });

        if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`✅ Email notification sent for message from ${name} (${email})`);
        } else {
            console.error(`❌ Resend API error ${res.statusCode}:`, toString(res.body));
        }
    } catch (err) {
        console.error("❌ Failed to send email via Resend:", err);
    }
}, "messages");

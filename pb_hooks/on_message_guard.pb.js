/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: anti-abuse checks on booking requests, before the record is saved.
 * Rejections throw, so the email hooks (same chain) never run for them.
 * Per-IP limits are PocketBase rate limit rules (migration 1793300000).
 */
onRecordCreateRequest((e) => {
    const MAX_PER_EMAIL_PER_DAY = 3;

    // Honeypot: hidden "website" field, left empty by people and filled by most bots
    const body = e.requestInfo().body || {};
    if (body.website) {
        console.warn(`⚠️ Booking request rejected (honeypot filled) from ${e.realIP()}`);
        throw new BadRequestError("Invalid request.");
    }

    const email = e.record.getString("email").toLowerCase();
    if (email) {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString().replace("T", " ");
        const recent = $app.countRecords(
            "messages",
            $dbx.exp("LOWER([[email]]) = {:email} AND [[created]] > {:since}", { email: email, since: since }),
        );
        if (recent >= MAX_PER_EMAIL_PER_DAY) {
            console.warn(`⚠️ Booking request rejected (${recent} requests in 24 h) for ${email}`);
            throw new TooManyRequestsError("Too many requests for this email address, please try again tomorrow.");
        }
    }

    e.next();
}, "messages");

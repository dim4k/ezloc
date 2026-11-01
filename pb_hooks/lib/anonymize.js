/**
 * Anonymizes booking requests older than MESSAGES_ANONYMIZE_DAYS days (default 30): name, email and phone.
 * 0 = off. Dates, message, estimate and options are kept.
 *
 * Plain SQL rather than record saves: older records may break the size limits added later
 * (migration 1793500000) and would fail validation; no hook runs, so no email is sent.
 */

const ANONYMOUS_NAME = "Anonyme";
const ANONYMOUS_EMAIL = "anonyme@anonyme.invalid";
const DEFAULT_DAYS = 30;

function anonymizeMessages(app) {
    const value = ($os.getenv("MESSAGES_ANONYMIZE_DAYS") || "").trim();
    const days = value ? parseInt(value, 10) : DEFAULT_DAYS;
    if (!(days > 0)) return;

    // Same format as the stored dates ("2025-01-31 12:00:00.000Z"), so they compare as strings
    const before = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString().replace("T", " ");
    try {
        const result = app.db()
            .newQuery("UPDATE messages SET name = {:name}, email = {:email}, phone = '' WHERE created < {:before} AND email != {:email}")
            .bind({ name: ANONYMOUS_NAME, email: ANONYMOUS_EMAIL, before: before })
            .execute();
        const count = result.rowsAffected();
        if (count) console.log(`🕶️ ${count} booking request(s) older than ${days} days anonymized`);
    } catch (err) {
        console.error("❌ Failed to anonymize booking requests:", err);
    }
}

module.exports = { anonymizeMessages };

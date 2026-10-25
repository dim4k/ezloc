/**
 * Booking emails (HTML for Resend). Plain CommonJS module: no PocketBase globals,
 * so it can be required from hooks (`require(`${__hooks}/lib/booking_emails.js`)`) and tested with Node.
 */

function escapeHtml(value, maxLength) {
    let text = value === undefined || value === null ? "" : String(value);
    if (maxLength && text.length > maxLength) text = text.slice(0, maxLength) + "…";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Admin-entered address may contain <br>: keep line breaks, escape everything else
function escapeWithBreaks(value) {
    return escapeHtml(value).replace(/&lt;br\s*\/?&gt;/gi, "<br>");
}

const OPTION_UNITS = { stay: "/ séjour", night: "/ nuit", guest: "/ pers.", guest_night: "/ pers. / nuit" };

function formatPrice(amount) {
    return String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
}

/** "Option linge (90 €)" lines for both emails. */
function optionsSummary(options) {
    return (options || []).map((option) => {
        const amount = typeof option.amount === "number" ? ` (${formatPrice(option.amount)})` : "";
        return `${escapeHtml(option.name, 80)}${amount}`;
    });
}

function row(label, value) {
    return `
        <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #ECE8DF;font-size:13px;color:#4E5A66;width:38%;">${label}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #ECE8DF;font-size:15px;font-weight:600;color:#0C1823;">${value}</td>
        </tr>`;
}

/**
 * Confirmation sent to the guest after a booking request.
 * @param {Object} data
 * @param {string} data.siteName
 * @param {string} data.ownerName
 * @param {string} data.guestName
 * @param {string} data.arrival
 * @param {string} data.departure
 * @param {number} [data.guests]
 * @param {Array<{name: string, amount?: number}>} [data.options]
 * @param {string} [data.estimate]
 * @param {string[]} [data.conditions]
 * @param {string} [data.address]
 * @param {string} [data.directionsUrl]
 * @param {string} [data.phone]
 * @param {string} [data.imageUrl]
 * @param {string} [data.siteUrl]
 * @returns {{subject: string, html: string}}
 */
function buildConfirmationEmail(data) {
    const siteName = escapeHtml(data.siteName || "Location");
    const arrival = escapeHtml(data.arrival, 40);
    const departure = escapeHtml(data.departure, 40);
    const hasDates = Boolean(data.arrival && data.departure);
    const estimate = data.estimate && data.estimate !== "Non calculé" ? escapeHtml(data.estimate, 20) : "";
    const options = optionsSummary(data.options);

    const subject = hasDates
        ? `${data.siteName || "Location"} — Votre demande du ${String(data.arrival).slice(0, 40)} au ${String(data.departure).slice(0, 40)} est bien reçue`
        : `${data.siteName || "Location"} — Votre demande de réservation est bien reçue`;

    const recap = [
        hasDates ? row("Arrivée", arrival) + row("Départ", departure) : row("Dates", "À préciser"),
        data.guests ? row("Voyageurs", escapeHtml(data.guests)) : "",
        options.length ? row("Options", options.join("<br>")) : "",
    ].join("");

    const html = `
<!doctype html>
<html lang="fr">
<body style="margin:0;padding:0;background:#ECE8DF;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ECE8DF;padding:28px 12px;font-family:Helvetica,Arial,sans-serif;color:#0C1823;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;">
    <tr><td style="background:#0C1823;padding:22px 28px;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#FFFFFF;">${siteName}</span>
    </td></tr>
    ${data.imageUrl ? `<tr><td><img src="${escapeHtml(data.imageUrl)}" alt="" width="560" style="display:block;width:100%;height:auto;max-height:200px;object-fit:cover;"></td></tr>` : ""}
    <tr><td style="padding:28px 28px 8px;">
        <p style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;">Bonjour ${escapeHtml(data.guestName, 80)},</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#2E3A46;">Nous avons bien reçu votre demande de séjour. ${escapeHtml(data.ownerName || "Nous")} revient vers vous très rapidement pour vous confirmer la disponibilité.</p>
    </td></tr>
    <tr><td style="padding:20px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ECE8DF;border-radius:12px;border-collapse:separate;overflow:hidden;">
            ${recap}
            ${estimate ? `
            <tr><td colspan="2" style="background:#F5F3EE;padding:14px 16px;">
                <span style="font-size:14px;">Estimation <span style="color:#4E5A66;">(prix indicatif)</span></span>
                <span style="float:right;font-family:Georgia,'Times New Roman',serif;font-size:22px;">${estimate}</span>
            </td></tr>` : ""}
        </table>
    </td></tr>
    ${data.conditions && data.conditions.length ? `
    <tr><td style="padding:4px 28px 0;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#1D4FA0;">Bon à savoir</p>
        <ul style="margin:0;padding:0 0 0 18px;font-size:14px;line-height:1.75;color:#2E3A46;">
            ${data.conditions.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
        </ul>
    </td></tr>` : ""}
    ${data.address ? `
    <tr><td style="padding:22px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0C1823;border-radius:12px;">
            <tr><td style="padding:18px;color:#FFFFFF;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#F2C230;">Adresse</p>
                <p style="margin:0 0 14px;font-size:14.5px;line-height:1.55;">${escapeWithBreaks(data.address)}</p>
                ${data.directionsUrl ? `<a href="${escapeHtml(data.directionsUrl)}" style="display:inline-block;background:#F2C230;color:#0C1823;font-weight:bold;font-size:14px;text-decoration:none;padding:11px 18px;border-radius:8px;">Ouvrir l'itinéraire</a>` : ""}
            </td></tr>
        </table>
    </td></tr>` : ""}
    <tr><td style="padding:22px 28px 26px;font-size:14px;line-height:1.6;color:#2E3A46;">
        Une question ? Répondez simplement à cet email${data.phone ? ` ou appelez le <strong style="color:#0C1823;">${escapeHtml(data.phone)}</strong>` : ""}.
    </td></tr>
</table>
<p style="margin:16px 0 0;font-size:12px;color:#4E5A66;">Vous recevez cet email suite à votre demande${data.siteUrl ? ` sur ${escapeHtml(data.siteUrl)}` : ""}.</p>
</td></tr>
</table>
</body>
</html>`.trim();

    return { subject, html };
}

module.exports = { escapeHtml, optionsSummary, buildConfirmationEmail };

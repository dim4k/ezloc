/// <reference path="../pb_data/types.d.ts" />

/**
 * App settings driven by environment variables, applied at every start.
 * Unset variables leave the settings as configured in the dashboard.
 *
 * TRUSTED_PROXY_HEADERS: header(s) carrying the visitor IP when PocketBase runs behind a reverse proxy,
 * comma-separated (e.g. "X-Forwarded-For", or "CF-Connecting-IP" behind Cloudflare).
 * Without it, rate limits count every visitor as the proxy's IP.
 *
 * SMTP (admin login codes and new-login alerts): Resend's SMTP relay as soon as RESEND_API_KEY is set,
 * or any server with SMTP_HOST / SMTP_PORT / SMTP_USERNAME / SMTP_PASSWORD / SMTP_TLS.
 * Sender: RESEND_FROM_EMAIL.
 *
 * ADMIN_MFA: superusers log in with their password AND a code sent by email (default "true").
 * Only turned on when SMTP is configured, so the code can be delivered.
 * Set to "false" and restart to turn it off (e.g. if the mailbox is unreachable).
 */
onBootstrap((e) => {
    e.next();

    const env = (name) => ($os.getenv(name) || "").trim();
    const settings = e.app.settings();
    let changed = false;

    // 1. Reverse proxy
    const headers = env("TRUSTED_PROXY_HEADERS").split(",").map((h) => h.trim()).filter(Boolean);
    if (headers.length) {
        settings.trustedProxy.headers = headers;
        // Rightmost X-Forwarded-For entry: the one added by our proxy, not one sent by the visitor
        settings.trustedProxy.useLeftmostIP = false;
        changed = true;
        console.log(`🔒 Trusted proxy headers: ${headers.join(", ")}`);
    }

    // 2. SMTP
    const smtpHost = env("SMTP_HOST") || (env("RESEND_API_KEY") ? "smtp.resend.com" : "");
    if (smtpHost) {
        const port = parseInt(env("SMTP_PORT"), 10) || 465;
        settings.smtp.enabled = true;
        settings.smtp.host = smtpHost;
        settings.smtp.port = port;
        settings.smtp.username = env("SMTP_USERNAME") || (env("SMTP_HOST") ? "" : "resend");
        settings.smtp.password = env("SMTP_PASSWORD") || (env("SMTP_HOST") ? "" : env("RESEND_API_KEY"));
        // Implicit TLS on 465, STARTTLS otherwise
        settings.smtp.tls = env("SMTP_TLS") ? env("SMTP_TLS") === "true" : port === 465;
        settings.meta.senderAddress = env("RESEND_FROM_EMAIL") || "contact@location-ile-aux-moines.fr";
        changed = true;
        console.log(`✉️ SMTP: ${smtpHost}:${port}`);
    }

    // Name shown in the login emails: the site name rather than PocketBase's placeholders
    if (env("SEO_TITLE") && settings.meta.appName === "Acme") {
        settings.meta.appName = env("SEO_TITLE");
        changed = true;
    }
    if (env("SEO_TITLE") && settings.meta.senderName === "Support") {
        settings.meta.senderName = env("SEO_TITLE");
        changed = true;
    }

    if (changed) e.app.save(settings);

    // 3. Admin two-factor login (password + email code)
    const superusers = e.app.findCollectionByNameOrId("_superusers");
    const wantMfa = env("ADMIN_MFA") !== "false" && settings.smtp.enabled;
    if (env("ADMIN_MFA") !== "false" && !settings.smtp.enabled) {
        console.warn("⚠️ Admin two-factor login is off: no SMTP server to send the codes (set RESEND_API_KEY or SMTP_HOST).");
    }
    if (superusers.mfa.enabled !== wantMfa || superusers.otp.enabled !== wantMfa) {
        superusers.mfa.enabled = wantMfa;
        superusers.otp.enabled = wantMfa;
        e.app.save(superusers);
    }
    console.log(`🔐 Admin two-factor login: ${wantMfa ? "on" : "off"}`);
});

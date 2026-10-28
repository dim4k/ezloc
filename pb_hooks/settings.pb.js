/// <reference path="../pb_data/types.d.ts" />

/**
 * App settings driven by environment variables, applied at every start.
 * Unset variables leave the settings as configured in the dashboard.
 *
 * TRUSTED_PROXY_HEADERS: header(s) carrying the visitor IP when PocketBase runs behind a reverse proxy,
 * comma-separated (e.g. "X-Forwarded-For", or "CF-Connecting-IP" behind Cloudflare).
 * Without it, rate limits count every visitor as the proxy's IP.
 */
onBootstrap((e) => {
    e.next();

    const headers = ($os.getenv("TRUSTED_PROXY_HEADERS") || "")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);
    if (!headers.length) return;

    const settings = e.app.settings();
    settings.trustedProxy.headers = headers;
    // Rightmost X-Forwarded-For entry: the one added by our proxy, not one sent by the visitor
    settings.trustedProxy.useLeftmostIP = false;
    e.app.save(settings);
    console.log(`🔒 Trusted proxy headers: ${headers.join(", ")}`);
});

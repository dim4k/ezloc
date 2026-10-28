/// <reference path="../pb_data/types.d.ts" />

/**
 * Security headers, on top of PocketBase's defaults (X-Frame-Options, X-Content-Type-Options,
 * Cross-Origin-Opener-Policy).
 * The Content-Security-Policy only runs the site's own script files: no inline <script> or onclick="",
 * so HTML injected into CMS content cannot run code. The dashboard (/_/) keeps PocketBase's own rules.
 */
routerUse((e) => {
    const headers = e.response.header();

    if (!e.request.url.path.startsWith("/_/")) {
        headers.set("Content-Security-Policy", [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            // Map tiles and images pasted into CMS rich text
            "img-src 'self' data: blob: https:",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
        ].join("; "));
    }

    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

    // HSTS only over https, served directly or through the reverse proxy
    if (e.request.tls || e.request.header.get("X-Forwarded-Proto") === "https") {
        headers.set("Strict-Transport-Security", "max-age=31536000");
    }

    return e.next();
});

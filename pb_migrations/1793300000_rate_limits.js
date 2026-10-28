/// <reference path="../pb_data/types.d.ts" />

/**
 * Turns on PocketBase's per-IP rate limiter, with stricter rules for the public booking form
 * and the iCal proxy. Rules can still be tuned in Dashboard > Settings > Application.
 * Behind a reverse proxy, set TRUSTED_PROXY_HEADERS (pb_hooks/settings.pb.js) so that the limits
 * count each visitor and not the proxy.
 */

const RULES = [
    { label: "messages:create", audience: "", duration: 600, maxRequests: 3 },
    { label: "/api/ical-proxy", audience: "", duration: 60, maxRequests: 30 },
];

migrate((app) => {
    const settings = app.settings();

    // Keep the existing rules (PocketBase defaults or admin changes), replace ours by label
    const labels = RULES.map((r) => r.label);
    const rules = [];
    for (let i = 0; i < settings.rateLimits.rules.length; i++) {
        const r = settings.rateLimits.rules[i];
        if (labels.indexOf(r.label) === -1) {
            rules.push({ label: r.label, audience: r.audience, duration: r.duration, maxRequests: r.maxRequests });
        }
    }

    settings.rateLimits.rules = RULES.concat(rules);
    settings.rateLimits.enabled = true;
    app.save(settings);
}, (app) => {
    const settings = app.settings();
    const labels = RULES.map((r) => r.label);
    const rules = [];
    for (let i = 0; i < settings.rateLimits.rules.length; i++) {
        const r = settings.rateLimits.rules[i];
        if (labels.indexOf(r.label) === -1) {
            rules.push({ label: r.label, audience: r.audience, duration: r.duration, maxRequests: r.maxRequests });
        }
    }

    settings.rateLimits.rules = rules;
    settings.rateLimits.enabled = false;
    app.save(settings);
});

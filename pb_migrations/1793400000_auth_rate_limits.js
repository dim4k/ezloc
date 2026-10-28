/// <reference path="../pb_data/types.d.ts" />

/**
 * Stricter per-IP limits on logins (password and email code) and on login code requests.
 * PocketBase's default "*:auth" rule allows 2 attempts every 3 seconds, i.e. 40 per minute.
 */

const RULES = [
    { label: "*:auth", audience: "", duration: 60, maxRequests: 5 },
    { label: "*:requestOTP", audience: "", duration: 300, maxRequests: 3 },
];
const PREVIOUS_AUTH_RULE = { label: "*:auth", audience: "", duration: 3, maxRequests: 2 };

function replaceRules(app, newRules) {
    const settings = app.settings();
    const labels = newRules.map((r) => r.label);
    const rules = newRules.slice();
    for (let i = 0; i < settings.rateLimits.rules.length; i++) {
        const r = settings.rateLimits.rules[i];
        if (labels.indexOf(r.label) === -1) {
            rules.push({ label: r.label, audience: r.audience, duration: r.duration, maxRequests: r.maxRequests });
        }
    }
    settings.rateLimits.rules = rules;
    app.save(settings);
}

migrate((app) => {
    replaceRules(app, RULES);
}, (app) => {
    const settings = app.settings();
    const rules = [];
    for (let i = 0; i < settings.rateLimits.rules.length; i++) {
        const r = settings.rateLimits.rules[i];
        if (r.label !== "*:requestOTP") {
            rules.push({ label: r.label, audience: r.audience, duration: r.duration, maxRequests: r.maxRequests });
        }
    }
    settings.rateLimits.rules = rules;
    app.save(settings);
    replaceRules(app, [PREVIOUS_AUTH_RULE]);
});

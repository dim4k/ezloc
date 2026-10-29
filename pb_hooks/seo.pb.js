/// <reference path="../pb_data/types.d.ts" />

/**
 * Pages for search engines and AI crawlers, rendered from the CMS (see pb_hooks/lib/seo.js):
 * the home page with its content, the sitemap, the favicon, the legal pages and a 404 page.
 * Rendered pages are cached and cleared whenever the site content changes.
 */

// "/{$}": the root only ("/" alone would match every path, like the static files route)
routerAdd("GET", "/{$}", (e) => {
    const seo = require(`${__hooks}/lib/seo.js`);
    return e.html(200, seo.homePage($app, seo.siteUrl(e)));
});

routerAdd("GET", "/index.html", (e) => e.redirect(301, "/"));

// All the site content in one response (js/cms.js uses it when the page has no inlined data)
routerAdd("GET", "/api/site", (e) => {
    const { loadSiteData } = require(`${__hooks}/lib/site.js`);
    return e.json(200, loadSiteData($app));
});

routerAdd("GET", "/sitemap.xml", (e) => {
    const seo = require(`${__hooks}/lib/seo.js`);
    return e.blob(200, "application/xml; charset=utf-8", seo.sitemap($app, seo.siteUrl(e)));
});

// Browsers and crawlers ask for /favicon.ico whatever the page declares
routerAdd("GET", "/favicon.ico", (e) => {
    const seo = require(`${__hooks}/lib/seo.js`);
    const url = seo.faviconUrl($app, seo.siteUrl(e));
    if (!url) throw new NotFoundError();
    return e.redirect(302, url);
});

// iOS asks for these when a visitor adds the site to the home screen, whatever the page declares
["/apple-touch-icon.png", "/apple-touch-icon-precomposed.png"].forEach((path) => {
    routerAdd("GET", path, (e) => {
        const seo = require(`${__hooks}/lib/seo.js`);
        const url = seo.appleTouchIconUrl($app, seo.siteUrl(e));
        if (!url) throw new NotFoundError();
        return e.redirect(302, url);
    });
});

// Legal pages (collection "pages"), once published in the dashboard
["mentions-legales", "confidentialite"].forEach((slug) => {
    routerAdd("GET", `/${slug}`, (e) => {
        const seo = require(`${__hooks}/lib/seo.js`);
        const slug = e.request.url.path.slice(1);
        const html = seo.legalPage($app, seo.siteUrl(e), slug);
        if (!html) throw new NotFoundError();
        return e.html(200, html);
    });
});

// Unknown pages: a small HTML page rather than PocketBase's JSON error (the API keeps its JSON errors)
routerUse((e) => {
    try {
        return e.next();
    } catch (err) {
        const path = e.request.url.path;
        const status = err && err.value && typeof err.value.status === "number" ? err.value.status : err.status;
        if (status !== 404 || e.request.method !== "GET" || path.startsWith("/api/") || path.startsWith("/_/")) throw err;

        const seo = require(`${__hooks}/lib/seo.js`);
        return e.html(404, seo.notFoundPage($app, seo.siteUrl(e)));
    }
});

// Content changed: rendered pages and cached data are rebuilt on the next request
const { COLLECTIONS } = require(`${__hooks}/lib/site.js`);
const clear = (e) => {
    require(`${__hooks}/lib/site.js`).clearCache($app);
    e.next();
};
onRecordAfterCreateSuccess(clear, ...COLLECTIONS);
onRecordAfterUpdateSuccess(clear, ...COLLECTIONS);
onRecordAfterDeleteSuccess(clear, ...COLLECTIONS);

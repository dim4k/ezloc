/**
 * ASSET LOADING
 * Stylesheets and scripts added on demand (theme assets, the map library).
 */

// Never let a slow stylesheet block the page for too long
const STYLE_TIMEOUT_MS = 2500;

export function loadStyle(href) {
    if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return Promise.resolve();
    return new Promise((resolve) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onload = link.onerror = resolve;
        document.head.appendChild(link);
        setTimeout(resolve, STYLE_TIMEOUT_MS);
    });
}

const scripts = {};

export function loadScript(src) {
    scripts[src] ??= new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => {
            console.warn(`Failed to load ${src}`);
            resolve();
        };
        document.head.appendChild(script);
    });
    return scripts[src];
}

/** Leaflet (~150 KB), only loaded when a map is about to be shown. */
export function loadLeaflet() {
    return Promise.all([
        loadStyle("css/vendor/leaflet/leaflet.css"),
        loadScript("js/vendor/leaflet.js"),
    ]);
}

/** Calls `callback` once `element` comes within `margin` of the viewport. */
export function whenNear(element, callback, margin = "600px") {
    if (!("IntersectionObserver" in window)) return callback();
    const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        callback();
    }, { rootMargin: margin });
    observer.observe(element);
}

/**
 * THEME LOADER
 * Picks the theme from `welcome.display_options.theme` (PocketBase),
 * or from the `?theme=` URL parameter to preview another theme.
 */

const THEMES = {
    classic: () => import("./themes/classic/index.js"),
    pavillons: () => import("./themes/pavillons/index.js"),
};

export const DEFAULT_THEME = "classic";

// Never let a slow stylesheet (e.g. Google Fonts) block the page for too long
const STYLE_TIMEOUT_MS = 2500;

export function resolveThemeName(display = {}) {
    const fromUrl = new URLSearchParams(window.location.search).get("theme");
    return [fromUrl, display.theme].find((name) => name && THEMES[name]) || DEFAULT_THEME;
}

function loadStyle(href) {
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

function loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => {
            console.warn(`Failed to load ${src}`);
            resolve();
        };
        document.head.appendChild(script);
    });
}

/**
 * Loads the theme module and its assets (styles, then scripts in order).
 * @param {Object} display - SITE_CONFIG.display
 * @returns {Promise<Object>} The theme definition.
 */
export async function loadTheme(display) {
    const name = resolveThemeName(display);
    const { default: theme } = await THEMES[name]();

    const root = document.documentElement;
    root.dataset.theme = name;
    if (theme.bodyClass) document.body.classList.add(...theme.bodyClass.split(" "));

    await Promise.all((theme.styles || []).map(loadStyle));
    for (const src of theme.scripts || []) await loadScript(src);
    if (theme.setup) theme.setup(display);

    return theme;
}

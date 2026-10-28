/**
 * THEME LOADER
 * Picks the theme from `welcome.display_options.theme` (PocketBase),
 * or from the `?theme=` URL parameter to preview another theme.
 */

import { loadStyle, loadScript } from "./shared/assets.js";

const THEMES = {
    classic: () => import("./themes/classic/index.js"),
    pavillons: () => import("./themes/pavillons/index.js"),
};

// Also the default of pb_hooks/lib/seo.js (font preloads)
export const DEFAULT_THEME = "classic";

export function resolveThemeName(display = {}) {
    const fromUrl = new URLSearchParams(window.location.search).get("theme");
    return [fromUrl, display.theme].find((name) => name && THEMES[name]) || DEFAULT_THEME;
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

import { initCMS, SITE_CONFIG } from "./cms.js";
import { loadTheme } from "./theme.js";

// Initialize App
(async () => {
    // Try to fetch data from CMS
    await initCMS();

    // Load the theme selected in PocketBase (welcome.display_options.theme)
    const theme = await loadTheme(SITE_CONFIG.display);

    // Register Components after config is potentially updated
    for (const [tag, component] of Object.entries(theme.components)) {
        customElements.define(tag, component);
    }

    // -- App Root (Orchestrator) --
    customElements.define("app-root", class AppRoot extends HTMLElement {
        connectedCallback() {
            this.innerHTML = theme.layout;
        }
    });

    // Global Fallback Check
    const appRoot = document.querySelector("app-root");

    // Check if critical config is missing (e.g. Identity or Welcome)
    // If mainly empty, show a message
    if (!SITE_CONFIG.identity || Object.keys(SITE_CONFIG).length === 0) {
        if (appRoot) {
            appRoot.innerHTML = `
                <div class="fixed inset-0 flex items-center justify-center bg-slate-50 text-slate-800 p-8 text-center">
                    <div class="max-w-md">
                        <i data-lucide="alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-6"></i>
                        <h1 class="text-3xl font-bold mb-4 font-serif">Configuration manquante</h1>
                        <p class="text-lg text-slate-600 mb-8">Impossible de charger le contenu du site. Veuillez vérifier que votre instance PocketBase est bien configurée et contient les collections requises.</p>
                        <a href="/_/" class="inline-block px-6 py-3 bg-breizh-navy text-white rounded-full hover:bg-breizh-blue transition-colors font-medium">Accéder à l'administration</a>
                    </div>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
        return;
    }

    if (theme.afterMount) theme.afterMount();

    // Content is rendered after page load: honour a "#section" link once the section exists
    const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: "instant" });
})();

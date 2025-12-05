import { NavBar } from "./components/NavBar.js";
import { WelcomeSection } from "./components/WelcomeSection.js";
import { HouseSection } from "./components/HouseSection.js";
import { ActivitiesSection } from "./components/ActivitiesSection.js";
import { MapSection } from "./components/MapSection.js";
import { FaqSection } from "./components/FaqSection.js";
import { ContactSection } from "./components/ContactSection.js";
import { SiteFooter } from "./components/SiteFooter.js";
import { DetailModal } from "./components/DetailModal.js";



import { initCMS, SITE_CONFIG } from "./cms.js";

// -- App Root (Orchestrator) --
class AppRoot extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav-bar></nav-bar>
            <main>
                <welcome-section></welcome-section>
                <house-section></house-section>
                <activities-section></activities-section>
                <map-section></map-section>
                <faq-section></faq-section>
                <contact-section></contact-section>
            </main>
            <site-footer></site-footer>
            <detail-modal></detail-modal>
        `;
    }
}

// Initialize App
(async () => {
    // Try to fetch data from CMS
    await initCMS();

    // Register Components after config is potentially updated
    customElements.define("nav-bar", NavBar);
    customElements.define("welcome-section", WelcomeSection);
    customElements.define("house-section", HouseSection);
    customElements.define("activities-section", ActivitiesSection);
    customElements.define("map-section", MapSection);
    customElements.define("faq-section", FaqSection);
    customElements.define("contact-section", ContactSection);
    customElements.define("site-footer", SiteFooter);
    customElements.define("detail-modal", DetailModal);
    customElements.define("app-root", AppRoot);

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
    }
})();

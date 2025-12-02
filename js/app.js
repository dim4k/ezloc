import { NavBar } from "./components/NavBar.js";
import { HeroSection } from "./components/HeroSection.js";
import { HouseFeatures } from "./components/HouseFeatures.js";
import { IslandSection } from "./components/IslandSection.js";
import { MapSection } from "./components/MapSection.js";
import { ContactSection } from "./components/ContactSection.js";
import { SiteFooter } from "./components/SiteFooter.js";
import { DetailModal } from "./components/DetailModal.js";



import { initCMS } from "./cms.js";

// -- App Root (Orchestrator) --
class AppRoot extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav-bar></nav-bar>
            <main>
                <hero-section></hero-section>
                <house-features></house-features>
                <island-section></island-section>
                <map-section></map-section>
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
    customElements.define("hero-section", HeroSection);
    customElements.define("house-features", HouseFeatures);
    customElements.define("island-section", IslandSection);
    customElements.define("map-section", MapSection);
    customElements.define("contact-section", ContactSection);
    customElements.define("site-footer", SiteFooter);
    customElements.define("detail-modal", DetailModal);
    customElements.define("app-root", AppRoot);
})();

/**
 * CLASSIC THEME
 * The original design (Playfair Display / Lato, navy & blue, AOS animations).
 */
import { NavBar } from "./components/NavBar.js";
import { WelcomeSection } from "./components/WelcomeSection.js";
import { HouseSection } from "./components/HouseSection.js";
import { ActivitiesSection } from "./components/ActivitiesSection.js";
import { MapSection } from "./components/MapSection.js";
import { ReviewsSection } from "./components/ReviewsSection.js";
import { FaqSection } from "./components/FaqSection.js";
import { ContactSection } from "./components/ContactSection.js";
import { SiteFooter } from "./components/SiteFooter.js";
import { DetailModal } from "./components/DetailModal.js";

export default {
    layout: `
        <nav-bar></nav-bar>
        <main>
            <welcome-section></welcome-section>
            <house-section></house-section>
            <activities-section></activities-section>
            <map-section></map-section>
            <reviews-section></reviews-section>
            <faq-section></faq-section>
            <contact-section></contact-section>
        </main>
        <site-footer></site-footer>
        <detail-modal></detail-modal>
    `,

    components: {
        "nav-bar": NavBar,
        "welcome-section": WelcomeSection,
        "house-section": HouseSection,
        "activities-section": ActivitiesSection,
        "map-section": MapSection,
        "reviews-section": ReviewsSection,
        "faq-section": FaqSection,
        "contact-section": ContactSection,
        "site-footer": SiteFooter,
        "detail-modal": DetailModal,
    },

    bodyClass: "bg-slate-50 font-sans text-slate-800",

    styles: [
        "css/themes/fonts-classic.css",
        "css/vendor/flatpickr.css",
        "css/vendor/aos.css",
    ],

    // Loaded in order (the French locale needs Flatpickr)
    scripts: [
        "js/vendor/flatpickr.js",
        "js/vendor/flatpickr-fr.js",
        "js/vendor/aos.js",
    ],

    afterMount() {
        // Initialize AOS after content is rendered
        setTimeout(() => {
            if (!window.AOS) return;
            AOS.init({
                duration: 800,
                once: true,
                offset: 100,
                easing: "ease-out-cubic",
            });
        }, 100);
    },
};

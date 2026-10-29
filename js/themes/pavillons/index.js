/**
 * PAVILLONS THEME
 * Immersive maritime design: Fraunces / Inter, navy & signal-flag yellow,
 * dates picker with nightly prices, CSS scroll animations (no AOS).
 */
import { PavNav } from "./components/PavNav.js";
import { PavHero } from "./components/PavHero.js";
import { PavIntro } from "./components/PavIntro.js";
import { PavHouse } from "./components/PavHouse.js";
import { PavActivities } from "./components/PavActivities.js";
import { PavPricing } from "./components/PavPricing.js";
import { PavMap } from "./components/PavMap.js";
import { PavReviews } from "./components/PavReviews.js";
import { PavFaq } from "./components/PavFaq.js";
import { PavContact } from "./components/PavContact.js";
import { PavFooter } from "./components/PavFooter.js";
import { PavBookingBar } from "./components/PavBookingBar.js";
import { PavDates } from "./components/PavDates.js";
import { PavLightbox } from "./components/PavLightbox.js";
import { observeReveals } from "./helpers.js";
import { loadAvailability } from "./store.js";

export default {
    layout: `
        <pav-nav></pav-nav>
        <main>
            <pav-hero></pav-hero>
            <pav-intro></pav-intro>
            <pav-house></pav-house>
            <pav-activities></pav-activities>
            <pav-pricing></pav-pricing>
            <pav-map></pav-map>
            <pav-reviews></pav-reviews>
            <pav-faq></pav-faq>
            <pav-contact></pav-contact>
        </main>
        <pav-footer></pav-footer>
        <pav-booking-bar></pav-booking-bar>
        <pav-dates></pav-dates>
        <pav-lightbox></pav-lightbox>
    `,

    components: {
        "pav-nav": PavNav,
        "pav-hero": PavHero,
        "pav-intro": PavIntro,
        "pav-house": PavHouse,
        "pav-activities": PavActivities,
        "pav-pricing": PavPricing,
        "pav-map": PavMap,
        "pav-reviews": PavReviews,
        "pav-faq": PavFaq,
        "pav-contact": PavContact,
        "pav-footer": PavFooter,
        "pav-booking-bar": PavBookingBar,
        "pav-dates": PavDates,
        "pav-lightbox": PavLightbox,
    },

    bodyClass: "bg-pav-chalk font-body text-pav-navy",

    styles: [
        "css/themes/fonts-pavillons.css",
        "css/themes/pavillons.css",
    ],

    setup(display = {}) {
        // Animations can be turned off with display_options: { "animations": false }
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!reduceMotion && display.animations !== false) {
            document.documentElement.classList.add("pav-motion");
        }
    },

    afterMount() {
        observeReveals();
        loadAvailability();
    },
};

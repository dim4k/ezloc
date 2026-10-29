import { BaseComponent } from "../../../shared/BaseComponent.js";
import { booking, goToBookingForm, openDates } from "../store.js";
import { FLAGS, fmtPrice, fmtShortDate, minNightlyPrice } from "../helpers.js";

// Time spent on each photo of the mobile stories
const STORY_DURATION_MS = 6000;

export class PavHero extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        this.unsubscribe = booking.subscribe(() => this.updateBooking());
    }

    disconnectedCallback() {
        this.unsubscribe?.();
        clearTimeout(this.storyTimer);
        this.storyObserver?.disconnect();
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
    }

    /** Once dates are picked, the price becomes the stay total and the main button leads to the form. */
    updateBooking() {
        const arrival = this.querySelector("[data-arrival]");
        const departure = this.querySelector("[data-departure]");
        if (arrival) arrival.textContent = booking.start ? fmtShortDate(booking.start) : "Ajouter une date";
        if (departure) departure.textContent = booking.end ? fmtShortDate(booking.end) : "Ajouter une date";

        const hero = this.config.labels?.hero || {};
        const estimate = booking.estimate();
        const minPrice = minNightlyPrice(this.config.pricing);
        this.querySelectorAll("[data-cta]").forEach((button) => {
            button.textContent = estimate ? hero.request || "Demander ces dates" : hero.availability || "Disponibilités";
        });
        // Mobile card and desktop bar both show the price
        this.querySelectorAll("[data-price-label]").forEach((label) => {
            label.textContent = estimate ? `Total · ${estimate.nights} nuit${estimate.nights > 1 ? "s" : ""}` : "À partir de";
        });
        this.querySelectorAll("[data-price]").forEach((price) => {
            if (estimate) price.textContent = fmtPrice(estimate.total);
            else if (minPrice != null) price.innerHTML = `${fmtPrice(minPrice)}<span class="text-[13px] font-normal text-pav-muted"> / nuit</span>`;
        });
    }

    /** Key facts shown as chips on mobile: labels.hero.facts, or the first amenities (3 fit on one line). */
    getFacts() {
        const facts = this.config.labels?.hero?.facts;
        return (Array.isArray(facts) && facts.length ? facts : this.config.house_config?.amenities || []).slice(0, 3);
    }

    /** Mobile stories: the hero_slides collection, or the welcome photo. */
    getStories() {
        const slides = this.config.heroSlides || [];
        if (slides.length) return slides;
        const { welcome } = this.config;
        return welcome.image ? [{ src: welcome.image, caption: "" }] : [];
    }

    showStory(index) {
        const count = this.storySlides.length;
        this.storyIndex = (index + count) % count;

        this.storySlides.forEach((slide, k) => {
            slide.classList.toggle("is-active", k === this.storyIndex);
        });
        this.storyBars.forEach((bar, k) => {
            bar.classList.toggle("is-done", k < this.storyIndex);
            bar.classList.remove("is-active");
        });
        void this.storyBars[this.storyIndex].offsetWidth; // restart the progress animation
        this.storyBars[this.storyIndex].classList.add("is-active");
        const { caption } = this.stories[this.storyIndex];
        const position = count > 1 ? `${this.storyIndex + 1} / ${count}` : "";
        this.storyCaption.textContent = [caption, position].filter(Boolean).join(" · ");

        clearTimeout(this.storyTimer);
        if (this.storyAutoplay && this.storyVisible && !document.hidden && this.isMobile.matches) {
            this.storyTimer = setTimeout(() => this.showStory(this.storyIndex + 1), STORY_DURATION_MS);
        }
    }

    setupStories() {
        const root = this.querySelector("[data-stories]");
        if (!root) return;

        this.storySlides = [...root.querySelectorAll(".pav-story")];
        this.storyBars = [...root.querySelectorAll(".pav-story-bar")];
        this.storyCaption = root.querySelector("[data-story-caption]");
        this.isMobile = window.matchMedia("(max-width: 767px)");
        // Auto-advance only with animations on (not for visitors who prefer reduced motion)
        this.storyAutoplay = document.documentElement.classList.contains("pav-motion");
        this.storyVisible = true;

        root.querySelector("[data-story-prev]").addEventListener("click", () => this.showStory(this.storyIndex - 1));
        root.querySelector("[data-story-next]").addEventListener("click", () => this.showStory(this.storyIndex + 1));

        // Horizontal swipe
        let touchX = null;
        root.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
        root.addEventListener("touchend", (e) => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            touchX = null;
            if (Math.abs(dx) > 50) this.showStory(this.storyIndex + (dx < 0 ? 1 : -1));
        }, { passive: true });

        // Pause while the hero is off screen or the tab is hidden
        if ("IntersectionObserver" in window) {
            this.storyObserver = new IntersectionObserver(([entry]) => {
                this.storyVisible = entry.isIntersecting;
                this.showStory(this.storyIndex);
            }, { threshold: 0.4 });
            this.storyObserver.observe(this.querySelector("#top"));
        }
        this.onVisibilityChange = () => this.showStory(this.storyIndex);
        document.addEventListener("visibilitychange", this.onVisibilityChange);

        this.showStory(0);
    }

    render() {
        const { welcome, identity } = this.config;
        if (!welcome || !identity) {
            this.style.display = "none";
            return;
        }

        const { hero = {}, contact = {} } = this.config.labels || {};
        const form = contact.form || {};
        const minPrice = minNightlyPrice(this.config.pricing);
        const facts = this.getFacts();
        this.stories = this.getStories();

        // The only <h1> of the page, read by screen readers and search engines. The two visual titles below
        // (mobile and desktop layouts) are hidden from them. Same text as pb_hooks/lib/seo.js.
        const heading = welcome.subtitle ? `${welcome.title} – ${welcome.subtitle}` : welcome.title || identity.name;

        // Each word slides up from its own mask
        const title = (welcome.title || "")
            .split(/\s+/)
            .map((word, i) => `<span class="pav-word"><span style="animation-delay:${0.25 + i * 0.13}s">${word}</span></span>`)
            .join(" ");

        this.innerHTML = `
            <section id="top" class="relative flex h-[100svh] min-h-[560px] flex-col overflow-hidden bg-pav-navy text-white md:h-auto md:min-h-[840px]">
                <h1 class="sr-only">${heading}</h1>
                <!-- Desktop: blurred full-bleed photo with parallax -->
                <div class="absolute inset-0 hidden md:block" aria-hidden="true">
                    <div class="pav-parallax absolute -inset-x-4 -bottom-4 -top-60">
                        ${welcome.image ? `<img src="${welcome.image}" alt="" class="pav-kenburns h-full w-full object-cover object-[35%_center] blur-sm">` : ""}
                    </div>
                    <div class="pav-hero-scrim absolute inset-0"></div>
                </div>

                <!-- Mobile: full-screen photo stories (hero_slides) -->
                ${this.stories.length ? `
                    <div data-stories class="absolute inset-0 md:hidden">
                        ${this.stories.map((story, k) => `
                            <div class="pav-story${k === 0 ? " is-active" : ""}">
                                <img src="${story.src}" alt="${story.caption || identity.name}, photo ${k + 1} sur ${this.stories.length}" ${k === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" class="pav-story-photo h-full w-full object-cover">
                            </div>
                        `).join("")}
                        <div class="pav-story-scrim absolute inset-0" aria-hidden="true"></div>
                        <div class="absolute inset-x-3 top-2 z-10 flex gap-1" aria-hidden="true">
                            ${this.stories.map(() => `<span class="pav-story-bar"><span></span></span>`).join("")}
                        </div>
                        <p data-story-caption class="absolute left-5 top-[76px] z-10 text-[13px] font-semibold text-white/90" aria-hidden="true"></p>
                        <!-- The text block below sits above these tap zones and keeps its own taps -->
                        <button type="button" data-story-prev class="absolute bottom-0 left-0 top-20 w-[35%]" aria-label="Photo précédente"></button>
                        <button type="button" data-story-next class="absolute bottom-0 right-0 top-20 w-[65%]" aria-label="Photo suivante"></button>
                    </div>
                ` : ""}

                <div class="relative z-10 mt-auto px-5 pb-2 md:hidden">
                    <div class="mb-5 flex gap-2">${FLAGS}</div>
                    <p class="pav-in text-xs font-semibold uppercase tracking-[0.16em] text-pav-yellow" style="--d:.1s" aria-hidden="true">${welcome.subtitle || ""}</p>
                    <p class="pav-hero-title mt-3 font-display text-[42px] leading-[1.04] tracking-[-0.03em]" aria-hidden="true">${title}</p>
                    ${facts.length ? `
                        <ul class="pav-hero-facts pav-in mt-5 flex flex-wrap gap-2 text-[13px] font-medium" style="--d:.6s">
                            ${facts.map((fact) => `<li class="rounded-full border border-white/25 bg-pav-navy/35 px-3 py-1.5">${fact}</li>`).join("")}
                        </ul>
                    ` : ""}
                    <div class="pav-in mt-7 flex items-center gap-4 rounded-[14px] bg-white py-2 pl-4 pr-2 text-pav-navy shadow-[0_18px_40px_-16px_rgba(0,0,0,.6)]" style="--d:.8s">
                        ${minPrice != null ? `
                            <p class="text-xs leading-tight text-pav-muted" aria-live="polite">
                                <span data-price-label></span>
                                <strong data-price class="block text-lg font-semibold text-pav-navy"></strong>
                            </p>
                        ` : ""}
                        <button type="button" data-cta class="pav-btn min-h-12 flex-1 text-[15px]"></button>
                    </div>
                    <a href="#intro" class="pav-in mx-auto mt-4 flex min-h-11 w-max flex-col items-center justify-center px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-white/60" style="--d:1s">
                        ${hero.discover || "Découvrir la maison"}
                        <i data-lucide="chevron-down" class="pav-scroll-hint h-[18px] w-[18px]"></i>
                    </a>
                </div>

                <div class="relative z-10 mx-auto mt-auto hidden w-full max-w-[1360px] px-10 pb-11 pt-28 md:block">
                    <div class="mb-6 flex gap-2">${FLAGS}</div>
                    <p class="pav-in text-base font-semibold uppercase tracking-[0.16em] text-pav-yellow" style="--d:.1s" aria-hidden="true">${welcome.subtitle || ""}</p>
                    <p class="pav-h1 mb-10 mt-3 max-w-[1100px]" aria-hidden="true">${title}</p>

                    <div class="flex items-end justify-between gap-8">
                        <div class="pav-in flex max-w-[980px] flex-1 items-stretch rounded-md bg-white p-2 text-pav-navy shadow-[0_24px_60px_-20px_rgba(0,0,0,.5)]" style="--d:.8s">
                            <button type="button" data-open-dates class="flex flex-1 flex-col gap-1 border-r border-pav-line px-[18px] py-2.5 text-left">
                                <span class="text-xs font-bold uppercase tracking-[0.1em] text-pav-muted">${form.arrival || "Arrivée"}</span>
                                <span data-arrival class="text-[17px] font-medium">Ajouter une date</span>
                            </button>
                            <button type="button" data-open-dates class="flex flex-1 flex-col gap-1 border-r border-pav-line px-[18px] py-2.5 text-left">
                                <span class="text-xs font-bold uppercase tracking-[0.1em] text-pav-muted">${form.departure || "Départ"}</span>
                                <span data-departure class="text-[17px] font-medium">Ajouter une date</span>
                            </button>
                            <div class="flex flex-1 flex-col justify-center gap-1 px-[18px] py-2.5" aria-live="polite">
                                <span data-price-label class="text-xs font-bold uppercase tracking-[0.1em] text-pav-muted"></span>
                                <span data-price class="text-[17px] font-semibold"></span>
                            </div>
                            <button type="button" data-cta class="pav-btn rounded px-6 text-base"></button>
                        </div>
                    </div>
                </div>
            </section>
        `;

        this.querySelectorAll("[data-open-dates]").forEach((button) => button.addEventListener("click", openDates));
        this.querySelectorAll("[data-cta]").forEach((button) => {
            button.addEventListener("click", () => (booking.hasRange ? goToBookingForm() : openDates()));
        });
        this.updateBooking();
        if (this.stories.length) this.setupStories();
    }
}

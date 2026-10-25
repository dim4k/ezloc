import { BaseComponent } from "../../../shared/BaseComponent.js";
import { booking, openDates } from "../store.js";
import { FLAGS, fmtPrice, fmtShortDate, minNightlyPrice } from "../helpers.js";

// Time spent on each photo of the mobile stories
const STORY_DURATION_MS = 6000;

export class PavHero extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        this.unsubscribe = booking.subscribe(() => this.updateDates());
    }

    disconnectedCallback() {
        this.unsubscribe?.();
        clearTimeout(this.storyTimer);
        this.storyObserver?.disconnect();
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
    }

    updateDates() {
        const arrival = this.querySelector("[data-arrival]");
        const departure = this.querySelector("[data-departure]");
        if (arrival) arrival.textContent = booking.start ? fmtShortDate(booking.start) : "Ajouter une date";
        if (departure) departure.textContent = booking.end ? fmtShortDate(booking.end) : "Ajouter une date";
    }

    /** Mobile stories: the photos of the first house feature ("La maison"), or the welcome photo. */
    getStories() {
        const { welcome, identity } = this.config;
        const house = (this.config.house_features || [])[0];
        const photos = house ? (house.gallery?.length ? house.gallery : [house.thumbnail].filter(Boolean)) : [];
        if (photos.length) return photos.map((src) => ({ src, label: house.title }));
        return welcome.image ? [{ src: welcome.image, label: identity.name }] : [];
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
        const priceLabel = minPrice != null ? `${fmtPrice(minPrice)} <span class="font-normal text-pav-muted">/ nuit</span>` : "";
        this.stories = this.getStories();

        // Each word slides up from its own mask
        const title = (welcome.title || "")
            .split(/\s+/)
            .map((word, i) => `<span class="pav-word"><span style="animation-delay:${0.25 + i * 0.13}s">${word}</span></span>`)
            .join(" ");

        this.innerHTML = `
            <section id="top" class="relative flex h-[100svh] min-h-[560px] flex-col overflow-hidden bg-pav-navy text-white md:h-auto md:min-h-[840px]">
                <!-- Desktop: blurred full-bleed photo with parallax -->
                <div class="absolute inset-0 hidden md:block" aria-hidden="true">
                    <div class="pav-parallax absolute -inset-x-4 -bottom-4 -top-60">
                        ${welcome.image ? `<img src="${welcome.image}" alt="" class="pav-kenburns h-full w-full object-cover object-[35%_center] blur-sm">` : ""}
                    </div>
                    <div class="pav-hero-scrim absolute inset-0"></div>
                </div>

                <!-- Mobile: full-screen photo stories -->
                ${this.stories.length ? `
                    <div data-stories class="absolute inset-0 md:hidden">
                        ${this.stories.map((story, k) => `
                            <div class="pav-story${k === 0 ? " is-active" : ""}">
                                <img src="${story.src}" alt="${story.label}, photo ${k + 1} sur ${this.stories.length}" ${k === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" class="pav-story-photo h-full w-full object-cover">
                            </div>
                        `).join("")}
                        <div class="pav-story-scrim absolute inset-0" aria-hidden="true"></div>
                        <div class="absolute inset-x-3 top-2 z-10 flex gap-1" aria-hidden="true">
                            ${this.stories.map(() => `<span class="pav-story-bar"><span></span></span>`).join("")}
                        </div>
                        <button type="button" data-story-prev class="absolute bottom-72 left-0 top-20 w-[35%]" aria-label="Photo précédente"></button>
                        <button type="button" data-story-next class="absolute bottom-72 right-0 top-20 w-[65%]" aria-label="Photo suivante"></button>
                    </div>
                ` : ""}

                <div class="relative z-10 mx-auto mt-auto w-full max-w-[1360px] px-5 pb-3 md:px-10 md:pb-11 md:pt-28">
                    <div class="mb-6 hidden gap-2 md:flex">${FLAGS}</div>
                    <p class="pav-in hidden text-base font-semibold uppercase tracking-[0.16em] text-pav-yellow md:block" style="--d:.1s">${welcome.subtitle || ""}</p>
                    <h1 class="pav-h1 mb-6 max-w-[1100px] md:mb-10 md:mt-3">${title}</h1>

                    <div class="hidden items-end justify-between gap-8 md:flex">
                        <div class="pav-in flex max-w-[980px] flex-1 items-stretch rounded-md bg-white p-2 text-pav-navy shadow-[0_24px_60px_-20px_rgba(0,0,0,.5)]" style="--d:.8s">
                            <button type="button" data-open-dates class="flex flex-1 flex-col gap-1 border-r border-pav-line px-[18px] py-2.5 text-left">
                                <span class="text-xs font-bold uppercase tracking-[0.1em] text-pav-muted">${form.arrival || "Arrivée"}</span>
                                <span data-arrival class="text-[17px] font-medium">Ajouter une date</span>
                            </button>
                            <button type="button" data-open-dates class="flex flex-1 flex-col gap-1 border-r border-pav-line px-[18px] py-2.5 text-left">
                                <span class="text-xs font-bold uppercase tracking-[0.1em] text-pav-muted">${form.departure || "Départ"}</span>
                                <span data-departure class="text-[17px] font-medium">Ajouter une date</span>
                            </button>
                            <div class="flex flex-1 flex-col justify-center gap-1 px-[18px] py-2.5">
                                <span class="text-xs font-bold uppercase tracking-[0.1em] text-pav-muted">À partir de</span>
                                <span class="text-[17px] font-semibold">${priceLabel}</span>
                            </div>
                            <button type="button" data-open-dates class="pav-btn rounded px-6 text-base">${hero.availability || "Disponibilités"}</button>
                        </div>
                        <a href="#maison" class="pav-in flex items-center gap-3 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-white" style="--d:1s">
                            <span class="pav-cue" aria-hidden="true"><span></span></span>${hero.discover || ""}
                        </a>
                    </div>

                    <div class="pav-in md:hidden" style="--d:.8s">
                        <div class="flex gap-2.5">
                            <button type="button" data-open-dates class="pav-btn min-h-14 flex-1 text-base">${hero.availability || "Disponibilités"}</button>
                            ${minPrice != null ? `<button type="button" data-open-dates class="min-h-14 rounded-lg border-[1.5px] border-white/40 px-4 text-[15px] font-semibold">dès ${fmtPrice(minPrice)}</button>` : ""}
                        </div>
                        <a href="#maison" class="pav-scroll-hint mx-auto mt-3 flex h-11 w-11 items-center justify-center text-white/85" aria-label="${hero.discover || "Découvrir la maison"}">
                            <i data-lucide="chevron-down" class="h-7 w-7"></i>
                        </a>
                    </div>
                </div>
            </section>
        `;

        this.querySelectorAll("[data-open-dates]").forEach((button) => button.addEventListener("click", openDates));
        this.updateDates();
        if (this.stories.length) this.setupStories();
    }
}

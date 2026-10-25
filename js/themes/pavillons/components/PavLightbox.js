import { BaseComponent } from "../../../shared/BaseComponent.js";
import { previewUrl } from "../helpers.js";

/**
 * Full-screen photo viewer for a house feature (room):
 * native swipe (scroll-snap), arrows, keyboard and thumbnails.
 */
export class PavLightbox extends BaseComponent {
    /**
     * @param {number} featureIndex - Index in SITE_CONFIG.house_features.
     * @param {number} photoIndex - Photo to show first.
     */
    open(featureIndex, photoIndex = 0) {
        const feature = this.config.house_features?.[featureIndex];
        if (!feature) return;
        const photos = feature.gallery?.length ? feature.gallery : [feature.thumbnail].filter(Boolean);
        this.count = photos.length;

        this.titleEl.textContent = feature.title;
        this.description.innerHTML = feature.shortDesc || "";
        this.track.setAttribute("aria-label", `Photos : ${feature.title}`);
        this.track.innerHTML = photos.map((src, k) => `
            <figure class="m-0 flex h-full w-full shrink-0 snap-center items-center justify-center px-2 md:px-20">
                <img src="${src}" alt="${feature.title} — photo ${k + 1} sur ${photos.length}" ${k === photoIndex ? "" : 'loading="lazy"'}
                     class="max-h-full max-w-full rounded-md object-contain">
            </figure>
        `).join("");
        this.thumbs.innerHTML = photos.length > 1 ? photos.map((src, k) => `
            <button type="button" data-thumb="${k}" class="pav-thumb h-12 w-16 shrink-0 overflow-hidden rounded" aria-label="Voir la photo ${k + 1}">
                <img src="${previewUrl(src)}" alt="" class="h-full w-full object-cover">
            </button>
        `).join("") : "";
        this.thumbs.hidden = photos.length < 2;
        this.prev.hidden = this.next.hidden = photos.length < 2;
        this.thumbs.querySelectorAll("[data-thumb]").forEach((button) => {
            button.addEventListener("click", () => this.goTo(Number(button.dataset.thumb)));
        });

        this.dialog.showModal();
        document.documentElement.style.overflow = "hidden";
        this.goTo(photoIndex, "instant");
        this.sync();
    }

    goTo(index, behavior = "smooth") {
        const clamped = Math.max(0, Math.min(this.count - 1, index));
        this.track.scrollTo({ left: clamped * this.track.clientWidth, behavior });
    }

    sync() {
        this.current = Math.round(this.track.scrollLeft / (this.track.clientWidth || 1));
        this.counter.textContent = `${this.current + 1} / ${this.count}`;
        this.thumbs.querySelectorAll("[data-thumb]").forEach((thumb, k) => {
            thumb.classList.toggle("is-active", k === this.current);
            if (k === this.current) thumb.scrollIntoView({ inline: "nearest", block: "nearest" });
        });
        this.prev.disabled = this.current === 0;
        this.next.disabled = this.current === this.count - 1;
    }

    render() {
        this.innerHTML = `
            <dialog class="pav-lightbox" aria-labelledby="pav-lightbox-title">
                <div class="flex h-full flex-col text-white">
                    <div class="flex items-center justify-between gap-4 px-4 py-3.5 md:px-6">
                        <button type="button" data-close class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Fermer la galerie">
                            <i data-lucide="x" class="h-5 w-5"></i>
                        </button>
                        <div class="min-w-0 text-center">
                            <p id="pav-lightbox-title" data-title class="truncate font-display text-xl"></p>
                            <p data-counter class="text-[13px] text-pav-muted-dark" aria-live="polite"></p>
                        </div>
                        <span class="w-11" aria-hidden="true"></span>
                    </div>

                    <div class="relative min-h-0 flex-1">
                        <div data-track class="pav-noscrollbar flex h-full snap-x snap-mandatory overflow-x-auto" style="touch-action: pan-x pinch-zoom"></div>
                        <button type="button" data-prev class="pav-lightbox-nav left-5" aria-label="Photo précédente"><i data-lucide="chevron-left" class="h-6 w-6"></i></button>
                        <button type="button" data-next class="pav-lightbox-nav right-5" aria-label="Photo suivante"><i data-lucide="chevron-right" class="h-6 w-6"></i></button>
                    </div>

                    <p class="pav-touch-hint flex items-center justify-center gap-2 pt-3 text-[13px] text-pav-muted-dark">
                        <i data-lucide="zoom-in" class="h-4 w-4"></i>Pincez pour zoomer · glissez pour changer
                    </p>
                    <div data-description class="pav-rich mx-auto w-full max-w-3xl px-4 pt-3 text-center text-[14.5px] leading-relaxed text-[#E2E7EC]"></div>
                    <div data-thumbs class="pav-noscrollbar mx-auto flex max-w-full gap-2 overflow-x-auto px-4 pb-6 pt-4"></div>
                </div>
            </dialog>
        `;

        this.dialog = this.querySelector("dialog");
        this.track = this.querySelector("[data-track]");
        this.titleEl = this.querySelector("[data-title]");
        this.counter = this.querySelector("[data-counter]");
        this.description = this.querySelector("[data-description]");
        this.thumbs = this.querySelector("[data-thumbs]");
        this.prev = this.querySelector("[data-prev]");
        this.next = this.querySelector("[data-next]");

        let frame;
        this.track.addEventListener("scroll", () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => this.sync());
        }, { passive: true });
        this.prev.addEventListener("click", () => this.goTo(this.current - 1));
        this.next.addEventListener("click", () => this.goTo(this.current + 1));
        this.querySelector("[data-close]").addEventListener("click", () => this.dialog.close());
        this.dialog.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") this.goTo(this.current - 1);
            if (e.key === "ArrowRight") this.goTo(this.current + 1);
        });
        this.dialog.addEventListener("close", () => {
            document.documentElement.style.overflow = "";
        });
    }
}

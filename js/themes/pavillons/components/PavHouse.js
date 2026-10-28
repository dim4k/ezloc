import { BaseComponent } from "../../../shared/BaseComponent.js";
import { previewUrl, sectionHeader } from "../helpers.js";

const photosOf = (feature) => (feature.gallery?.length ? feature.gallery : [feature.thumbnail].filter(Boolean));

export class PavHouse extends BaseComponent {
    render() {
        const { house_config: houseConfig, house_features: features } = this.config;
        if (!houseConfig || !features || features.length === 0) {
            this.style.display = "none";
            return;
        }

        this.innerHTML = `
            <section id="maison" class="bg-white py-20 md:py-32">
                <div class="mx-auto max-w-[1360px] md:px-10">
                    <div class="px-5 md:px-0">
                        ${sectionHeader({ num: "01", eyebrow: houseConfig.title, title: houseConfig.subtitle })}
                    </div>
                    <div class="md:grid md:grid-cols-[280px_minmax(0,1fr)] md:items-start md:gap-10">
                        <div role="tablist" aria-label="${houseConfig.title || ""}" data-tablist
                             class="pav-tablist pav-noscrollbar flex snap-x gap-2 overflow-x-auto scroll-px-5 px-5 pb-6 md:flex-col md:gap-1 md:overflow-visible md:px-0 md:pb-0">
                            ${features.map((feature, i) => `
                                <button type="button" role="tab" id="pav-tab-${i}" aria-controls="pav-room" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-index="${i}"
                                        class="pav-tab flex min-h-11 shrink-0 snap-start items-center gap-3 whitespace-nowrap rounded-full border border-[#D6D0C4] bg-white px-[18px] text-sm font-medium md:min-h-12 md:w-full md:whitespace-normal md:rounded md:border-transparent md:bg-transparent md:px-4 md:text-left md:text-base">
                                    ${feature.icon ? `<i data-lucide="${feature.icon}" class="hidden h-[18px] w-[18px] shrink-0 md:block"></i>` : ""}
                                    ${feature.title}
                                </button>
                            `).join("")}
                        </div>
                        <div id="pav-room" role="tabpanel" aria-labelledby="pav-tab-0" class="pav-reveal min-w-0"></div>
                    </div>
                </div>
            </section>
        `;

        this.tabs = [...this.querySelectorAll('[role="tab"]')];
        this.tabs.forEach((tab) => {
            tab.addEventListener("click", () => this.showRoom(Number(tab.dataset.index)));
            tab.addEventListener("keydown", (e) => this.onTabKeydown(e));
        });
        this.showRoom(0, { initial: true });

        // Fade the edges of the horizontal (mobile) tab list where more tabs are hidden
        const tablist = this.querySelector("[data-tablist]");
        const updateFade = () => {
            const max = tablist.scrollWidth - tablist.clientWidth;
            tablist.classList.toggle("can-scroll-left", tablist.scrollLeft > 4);
            tablist.classList.toggle("can-scroll-right", tablist.scrollLeft < max - 4);
        };
        let frame;
        const scheduleFade = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(updateFade);
        };
        tablist.addEventListener("scroll", scheduleFade, { passive: true });
        this.onResize = scheduleFade;
        window.addEventListener("resize", this.onResize, { passive: true });
        updateFade();
    }

    disconnectedCallback() {
        window.removeEventListener("resize", this.onResize);
    }

    onTabKeydown(e) {
        const current = this.tabs.indexOf(e.currentTarget);
        const last = this.tabs.length - 1;
        const next = {
            ArrowRight: current + 1, ArrowDown: current + 1,
            ArrowLeft: current - 1, ArrowUp: current - 1,
            Home: 0, End: last,
        }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        const index = (next + this.tabs.length) % this.tabs.length;
        this.showRoom(index);
        this.tabs[index].focus();
    }

    showRoom(index, { initial = false } = {}) {
        const feature = this.config.house_features[index];
        const photos = photosOf(feature);
        const multi = photos.length > 1;
        const panel = this.querySelector("#pav-room");

        this.tabs.forEach((tab, i) => {
            tab.setAttribute("aria-selected", String(i === index));
            tab.tabIndex = i === index ? 0 : -1;
        });
        panel.setAttribute("aria-labelledby", `pav-tab-${index}`);

        // Keep the selected chip visible in the horizontal (mobile) tab list
        if (!initial) {
            const tablist = this.querySelector("[data-tablist]");
            const tab = this.tabs[index];
            if (tablist.scrollWidth > tablist.clientWidth) {
                tablist.scrollTo({ left: tab.offsetLeft - 20, behavior: "smooth" });
            }
        }

        panel.innerHTML = `
            <div class="relative">
                <div data-track aria-label="Photos : ${feature.title}"
                     class="pav-noscrollbar relative flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-5 px-5 md:gap-0 md:rounded-md md:px-0">
                    ${photos.map((src, k) => `
                        <figure class="m-0 shrink-0 snap-start overflow-hidden rounded-2xl bg-pav-sand md:basis-full md:rounded-none ${multi ? "basis-[88%]" : "basis-full"}">
                            <button type="button" data-zoom="${k}" class="pav-zoom-btn block w-full" aria-label="Agrandir : ${feature.title}, photo ${k + 1} sur ${photos.length}">
                                <img src="${src}" alt="${feature.title}, photo ${k + 1} sur ${photos.length}" ${k > 0 ? 'loading="lazy"' : ""} decoding="async" class="aspect-[4/3] w-full object-cover md:aspect-[16/10]">
                            </button>
                        </figure>
                    `).join("")}
                </div>
                <button type="button" data-expand class="absolute right-4 top-4 hidden items-center gap-2 rounded-full bg-pav-navy/75 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-pav-navy md:inline-flex">
                    <i data-lucide="maximize-2" class="h-4 w-4"></i>Plein écran
                </button>
                ${multi ? `
                    <button type="button" data-prev class="pav-round absolute left-4 top-1/2 hidden -translate-y-1/2 md:inline-flex" aria-label="Photo précédente"><i data-lucide="chevron-left" class="h-5 w-5"></i></button>
                    <button type="button" data-next class="pav-round absolute right-4 top-1/2 hidden -translate-y-1/2 md:inline-flex" aria-label="Photo suivante"><i data-lucide="chevron-right" class="h-5 w-5"></i></button>
                    <span data-counter class="absolute bottom-4 right-4 hidden rounded bg-pav-navy px-3 py-2 text-sm font-semibold text-white md:inline">1 / ${photos.length}</span>
                ` : ""}
            </div>
            ${multi ? `
                <div class="flex justify-center gap-1.5 pt-4 md:hidden" aria-hidden="true">
                    ${photos.map((_, k) => `<span class="pav-dot${k === 0 ? " is-active" : ""}"></span>`).join("")}
                </div>
            ` : ""}
            <div class="px-5 pt-6 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-6 md:px-0">
                <div>
                    <h3 class="pav-h3">${feature.title}</h3>
                    <div class="pav-rich mt-2.5 max-w-[640px] text-base leading-relaxed text-pav-ink md:text-[17px]">${feature.fullDesc || feature.shortDesc || ""}</div>
                </div>
                ${multi ? `
                    <div class="hidden max-w-[400px] flex-wrap justify-end gap-2 md:flex">
                        ${photos.map((src, k) => `
                            <button type="button" data-thumb="${k}" class="pav-thumb h-14 w-[72px] overflow-hidden rounded${k === 0 ? " is-active" : ""}" aria-label="Voir la photo ${k + 1}">
                                <img src="${previewUrl(src)}" alt="" loading="lazy" class="h-full w-full object-cover">
                            </button>
                        `).join("")}
                    </div>
                ` : ""}
            </div>
        `;

        if (!initial) {
            panel.classList.remove("pav-fade");
            void panel.offsetWidth; // restart the fade animation
            panel.classList.add("pav-fade");
        }
        if (window.lucide) lucide.createIcons();

        // Full-screen viewer
        this.currentPhoto = 0;
        const lightbox = document.querySelector("pav-lightbox");
        panel.querySelectorAll("[data-zoom]").forEach((button) => {
            button.addEventListener("click", () => lightbox?.open(index, Number(button.dataset.zoom)));
        });
        panel.querySelector("[data-expand]").addEventListener("click", () => lightbox?.open(index, this.currentPhoto));

        if (multi) this.bindCarousel(panel, photos.length);
    }

    bindCarousel(panel, count) {
        const track = panel.querySelector("[data-track]");
        const slides = [...track.children];
        const counter = panel.querySelector("[data-counter]");
        const dots = panel.querySelectorAll(".pav-dot");
        const thumbs = panel.querySelectorAll("[data-thumb]");
        const prev = panel.querySelector("[data-prev]");
        const next = panel.querySelector("[data-next]");
        let current = 0;

        const goTo = (k) => {
            const target = slides[Math.max(0, Math.min(count - 1, k))];
            track.scrollTo({ left: target.offsetLeft - slides[0].offsetLeft, behavior: "smooth" });
        };

        const sync = () => {
            const step = slides[1].offsetLeft - slides[0].offsetLeft;
            current = Math.max(0, Math.min(count - 1, Math.round(track.scrollLeft / step)));
            this.currentPhoto = current;
            if (counter) counter.textContent = `${current + 1} / ${count}`;
            dots.forEach((dot, k) => dot.classList.toggle("is-active", k === current));
            thumbs.forEach((thumb, k) => thumb.classList.toggle("is-active", k === current));
            prev.disabled = current === 0;
            next.disabled = current === count - 1;
        };

        let frame;
        track.addEventListener("scroll", () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(sync);
        }, { passive: true });
        prev.addEventListener("click", () => goTo(current - 1));
        next.addEventListener("click", () => goTo(current + 1));
        thumbs.forEach((thumb) => thumb.addEventListener("click", () => goTo(Number(thumb.dataset.thumb))));
        sync();
    }
}

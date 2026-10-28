import { BaseComponent } from "../../../shared/BaseComponent.js";
import { sectionHeader } from "../helpers.js";

const pad = (n) => String(n).padStart(2, "0");

/**
 * Mobile: 2×2 photo tiles, each opening a bottom sheet with the full text.
 * Desktop: two staggered columns.
 */
export class PavActivities extends BaseComponent {
    render() {
        const { activities_config: config, activities } = this.config;
        if (!config || !activities || activities.length === 0) {
            this.style.display = "none";
            return;
        }

        this.innerHTML = `
            <section id="ile" class="bg-pav-navy py-20 text-white md:py-32">
                <div class="mx-auto max-w-[1360px] md:px-10">
                    <div class="px-5 md:px-0">
                        ${sectionHeader({ num: "02", eyebrow: config.subtitle, title: config.title, dark: true })}
                    </div>

                    <!-- Mobile: tiles -->
                    <div class="pav-reveal grid grid-cols-2 gap-2.5 px-5 md:hidden">
                        ${activities.map((activity, i) => `
                            <button type="button" data-open="${i}" aria-haspopup="dialog" class="relative h-[220px] overflow-hidden rounded-2xl bg-pav-navy-2 text-left">
                                ${activity.images?.[0] ? `<img src="${activity.images[0]}" alt="" loading="lazy" decoding="async" class="absolute inset-0 h-full w-full object-cover">` : ""}
                                <span class="absolute inset-0 bg-gradient-to-b from-transparent from-35% to-pav-navy/95" aria-hidden="true"></span>
                                <span class="absolute inset-x-3.5 bottom-3.5 flex flex-col gap-1">
                                    <span class="text-xs font-semibold tracking-[0.12em] text-pav-yellow">${pad(i + 1)}</span>
                                    <span class="text-base font-semibold leading-snug">${activity.title}</span>
                                </span>
                            </button>
                        `).join("")}
                    </div>
                    <p class="mt-5 flex items-center justify-center gap-2 px-5 text-[13px] text-pav-muted-dark md:hidden">
                        <i data-lucide="pointer" class="h-4 w-4"></i>Touchez une vignette pour en savoir plus
                    </p>

                    <!-- Desktop: staggered columns -->
                    <div class="hidden grid-cols-2 gap-x-12 gap-y-16 md:grid">
                        ${activities.map((activity, i) => `
                            <article class="${i % 2 ? "mt-24" : ""}">
                                ${activity.images?.[0] ? `
                                    <div class="overflow-hidden rounded">
                                        <img src="${activity.images[0]}" alt="${activity.title.trim()}" loading="lazy" decoding="async" class="pav-unveil aspect-video w-full object-cover">
                                    </div>
                                ` : ""}
                                <div class="pav-reveal flex items-baseline gap-5 pt-6">
                                    <span class="font-display text-[56px] leading-none text-pav-yellow">${pad(i + 1)}</span>
                                    <div>
                                        <h3 class="text-2xl font-semibold leading-snug">${activity.title}</h3>
                                        <div class="pav-rich mt-2.5 text-base leading-relaxed text-pav-muted-dark">${activity.description || ""}</div>
                                    </div>
                                </div>
                            </article>
                        `).join("")}
                    </div>
                </div>
            </section>

            <dialog class="pav-sheet pav-sheet-fit" aria-labelledby="pav-ile-title">
                <div data-sheet-body class="max-h-[88svh] overflow-y-auto px-5 pb-6 pt-2.5">
                    <div class="mx-auto mb-3 h-[5px] w-11 rounded-full bg-white/25" aria-hidden="true"></div>
                    <div class="relative min-h-11">
                        <img data-sheet-img alt="" class="aspect-video w-full rounded-[14px] object-cover">
                        <button type="button" data-close class="absolute right-2.5 top-2.5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-pav-navy/75" aria-label="Fermer">
                            <i data-lucide="x" class="h-5 w-5"></i>
                        </button>
                    </div>
                    <p data-sheet-num class="mt-[18px] text-xs font-semibold tracking-[0.12em] text-pav-yellow"></p>
                    <h3 id="pav-ile-title" data-sheet-title class="pav-h3 mt-1.5"></h3>
                    <div data-sheet-desc class="pav-rich mt-3 text-[15px] leading-relaxed text-pav-muted-dark"></div>
                    ${activities.length > 1 ? `
                        <div class="mt-5 flex justify-end">
                            <button type="button" data-next class="pav-btn min-h-12 text-[15px]">
                                <span data-next-label></span><i data-lucide="arrow-right" class="h-[18px] w-[18px]"></i>
                            </button>
                        </div>
                    ` : ""}
                </div>
            </dialog>
        `;

        this.dialog = this.querySelector("dialog");
        this.querySelectorAll("[data-open]").forEach((tile) => {
            tile.addEventListener("click", () => this.openSheet(Number(tile.dataset.open)));
        });
        this.querySelector("[data-close]").addEventListener("click", () => this.dialog.close());
        this.querySelector("[data-next]")?.addEventListener("click", () => {
            this.openSheet((this.current + 1) % activities.length);
        });

        // Click on the backdrop closes the sheet
        this.dialog.addEventListener("click", (e) => {
            if (e.target === this.dialog) this.dialog.close();
        });
        this.dialog.addEventListener("close", () => {
            document.documentElement.style.overflow = "";
        });
    }

    /** Fills the sheet with one activity (opening it if needed). */
    openSheet(index) {
        const { activities } = this.config;
        const activity = activities[index];
        const body = this.querySelector("[data-sheet-body]");
        const img = this.querySelector("[data-sheet-img]");
        this.current = index;

        img.hidden = !activity.images?.[0];
        if (activity.images?.[0]) img.src = activity.images[0];
        this.querySelector("[data-sheet-num]").textContent = `${pad(index + 1)} / ${pad(activities.length)}`;
        this.querySelector("[data-sheet-title]").textContent = activity.title;
        this.querySelector("[data-sheet-desc]").innerHTML = activity.description || "";
        const nextLabel = this.querySelector("[data-next-label]");
        if (nextLabel) nextLabel.textContent = activities[(index + 1) % activities.length].title;

        body.scrollTop = 0;
        if (this.dialog.open) {
            body.classList.remove("pav-fade");
            void body.offsetWidth; // restart the fade animation
            body.classList.add("pav-fade");
        } else {
            this.dialog.showModal();
            document.documentElement.style.overflow = "hidden";
        }
    }
}

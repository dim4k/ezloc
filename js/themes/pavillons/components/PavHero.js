import { BaseComponent } from "../../../shared/BaseComponent.js";
import { booking, openDates } from "../store.js";
import { FLAGS, fmtPrice, fmtShortDate, minNightlyPrice } from "../helpers.js";

export class PavHero extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        this.unsubscribe = booking.subscribe(() => this.updateDates());
    }

    disconnectedCallback() {
        this.unsubscribe?.();
    }

    updateDates() {
        const arrival = this.querySelector("[data-arrival]");
        const departure = this.querySelector("[data-departure]");
        if (arrival) arrival.textContent = booking.start ? fmtShortDate(booking.start) : "Ajouter une date";
        if (departure) departure.textContent = booking.end ? fmtShortDate(booking.end) : "Ajouter une date";
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

        // Each word slides up from its own mask
        const title = (welcome.title || "")
            .split(/\s+/)
            .map((word, i) => `<span class="pav-word"><span style="animation-delay:${0.25 + i * 0.13}s">${word}</span></span>`)
            .join(" ");

        this.innerHTML = `
            <section id="top" class="relative flex min-h-[100svh] flex-col overflow-hidden bg-pav-navy text-white md:min-h-[840px]">
                <div class="pav-parallax absolute -inset-x-4 -bottom-4 -top-60" aria-hidden="true">
                    ${welcome.image ? `<img src="${welcome.image}" alt="" fetchpriority="high" class="pav-kenburns h-full w-full object-cover object-center blur-sm md:object-[35%_center]">` : ""}
                </div>
                <div class="pav-hero-scrim absolute inset-0" aria-hidden="true"></div>

                <div class="relative z-10 mx-auto mt-auto w-full max-w-[1360px] px-5 pb-8 pt-28 md:px-10 md:pb-11">
                    <div class="mb-5 flex gap-1.5 md:mb-6 md:gap-2">${FLAGS}</div>
                    <p class="pav-in text-xs font-semibold uppercase tracking-[0.16em] text-pav-yellow md:text-base" style="--d:.1s">${welcome.subtitle || ""}</p>
                    <h1 class="pav-h1 mb-7 mt-3 max-w-[1100px] md:mb-10">${title}</h1>

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
                        <button type="button" data-open-dates class="pav-btn min-h-14 w-full text-base">${hero.availability || "Disponibilités"}</button>
                        ${minPrice != null ? `<p class="mt-3 text-center text-sm text-white/85">à partir de ${fmtPrice(minPrice)} / nuit</p>` : ""}
                    </div>
                </div>
            </section>
        `;

        this.querySelectorAll("[data-open-dates]").forEach((button) => button.addEventListener("click", openDates));
        this.updateDates();
    }
}

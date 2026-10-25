import { BaseComponent } from "../../../shared/BaseComponent.js";
import { getNightlyPrice } from "../../../utils/BookingUtils.js";
import { fmtPeriodDay, fmtPrice, sectionHeader } from "../helpers.js";

// Light → dark: the darker the band, the higher the nightly price
const BAND_COLORS = ["#DCE5F2", "#A9C0E3", "#5F86C6", "#1D4FA0"];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const monthShort = new Intl.DateTimeFormat("fr-FR", { month: "short" });
const dayMonth = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

/** Splits a (non-leap) year into consecutive runs of days sharing the same nightly price. */
function yearSegments(pricing) {
    const segments = [];
    for (let date = new Date(2023, 0, 1); date.getFullYear() === 2023; date.setDate(date.getDate() + 1)) {
        const price = getNightlyPrice(date, pricing);
        const last = segments[segments.length - 1];
        if (last && last.price === price) {
            last.days++;
            last.end = new Date(date);
        } else {
            segments.push({ price, days: 1, start: new Date(date), end: new Date(date) });
        }
    }
    return segments;
}

export class PavPricing extends BaseComponent {
    render() {
        const pricing = this.config.pricing;
        if (!pricing || pricing.defaultPrice == null) {
            this.style.display = "none";
            return;
        }

        const labels = this.config.labels?.pricing || {};
        const segments = yearSegments(pricing);
        const prices = [...new Set(segments.map((s) => s.price))].sort((a, b) => a - b);
        const bandOf = (price) => {
            const i = prices.indexOf(price);
            return prices.length === 1 ? 3 : Math.round((i * 3) / (prices.length - 1));
        };

        const legend = [
            ...(pricing.periods || []).map((p) => ({ label: `${fmtPeriodDay(p.start)} → ${fmtPeriodDay(p.end)}`, price: p.price })),
            { label: "Le reste de l'année", price: pricing.defaultPrice },
        ].sort((a, b) => b.price - a.price);

        const ariaLabel = "Prix par nuit sur l'année : " + segments
            .map((s) => `du ${dayMonth.format(s.start)} au ${dayMonth.format(s.end)}, ${fmtPrice(s.price)}`)
            .join(" ; ");

        const conditions = [
            ...(pricing.cleaningFee != null ? [`Frais de ménage : ${fmtPrice(pricing.cleaningFee)} par séjour`] : []),
            ...(pricing.details || []),
        ];

        this.innerHTML = `
            <section id="tarifs" class="bg-pav-chalk py-20 md:py-32">
                <div class="mx-auto max-w-[1360px] px-5 md:px-10">
                    ${sectionHeader({ num: "03", eyebrow: labels.title || "Tarifs", title: labels.subtitle || "L'année en un coup d'œil" })}

                    <div class="pav-reveal rounded-2xl bg-white p-6 md:p-10">
                        <figure class="pav-wipe m-0">
                            <div class="pav-wipe-target flex h-11 gap-0.5 overflow-hidden rounded-md md:h-24" role="img" aria-label="${ariaLabel}">
                                ${segments.map((s) => {
                                    const band = bandOf(s.price);
                                    return `
                                        <div class="flex items-center justify-center font-semibold" style="flex:${s.days} 1 0;background:${BAND_COLORS[band]};color:${band >= 2 ? "#FFFFFF" : "#0C1823"}">
                                            ${s.days >= 25 ? `<span class="hidden text-lg md:inline">${fmtPrice(s.price)}</span>` : ""}
                                        </div>`;
                                }).join("")}
                            </div>
                            <div class="mt-2 flex text-[11px] font-semibold text-pav-muted md:text-[13px]" aria-hidden="true">
                                ${MONTH_DAYS.map((days, m) => {
                                    const name = monthShort.format(new Date(2023, m, 1));
                                    return `<span style="flex:${days} 1 0"><span class="md:hidden">${name[0].toUpperCase()}</span><span class="hidden md:inline">${name}</span></span>`;
                                }).join("")}
                            </div>
                        </figure>
                        <ul class="mt-6 md:mt-10 md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-4">
                            ${legend.map((item) => {
                                const band = bandOf(item.price);
                                return `
                                    <li class="flex items-center justify-between gap-3 border-t border-pav-sand py-3.5 text-[15px] md:flex-col md:items-start md:rounded-xl md:border-0 md:bg-pav-chalk md:p-5">
                                        <span class="flex items-center gap-3">
                                            <span class="h-3 w-3 shrink-0 rounded-[3px]${band === 0 ? " border border-[#A9C0E3]" : ""}" style="background:${BAND_COLORS[band]}" aria-hidden="true"></span>
                                            ${item.label}
                                        </span>
                                        <span class="font-semibold md:font-display md:text-[30px] md:font-normal">${fmtPrice(item.price)}<span class="hidden font-body text-sm text-pav-muted md:inline"> / nuit</span></span>
                                    </li>`;
                            }).join("")}
                        </ul>
                        <p class="mt-4 text-[13px] text-pav-muted md:hidden">Prix par nuit</p>
                    </div>

                    ${conditions.length ? `
                        <div class="pav-reveal mt-4 rounded-2xl bg-white p-6 md:mt-6 md:p-10">
                            <p class="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-pav-muted">Bon à savoir</p>
                            <ul class="flex flex-col gap-4 text-[15px] leading-relaxed md:grid md:grid-cols-2 md:gap-x-10 md:text-base">
                                ${conditions.map((item) => `
                                    <li class="flex gap-3"><i data-lucide="check" class="mt-0.5 h-[18px] w-[18px] shrink-0 text-pav-blue"></i><span>${item}</span></li>
                                `).join("")}
                            </ul>
                        </div>
                    ` : ""}
                </div>
            </section>
        `;
    }
}

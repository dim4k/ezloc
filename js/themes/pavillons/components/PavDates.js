import { BaseComponent } from "../../../shared/BaseComponent.js";
import { toDateKey } from "../../../shared/booking.js";
import { getNightlyPrice } from "../../../utils/BookingUtils.js";
import { booking, goToBookingForm, startOfToday } from "../store.js";
import { fmtLongDate, fmtPrice, fmtShortDate, ruleText } from "../helpers.js";

const MONTHS_SHOWN = 12;
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const monthTitle = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

/**
 * Dates picker: bottom sheet on mobile, centered dialog on desktop.
 * Shows the nightly price under each day, greys out the Airbnb bookings,
 * enforces the stay rules and explains when the house looks fully booked.
 */
export class PavDates extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        this.unsubscribe = booking.subscribe(() => {
            if (this.dialog?.open) this.paint();
        });
    }

    disconnectedCallback() {
        this.unsubscribe?.();
    }

    open() {
        if (!this.built) this.buildMonths();
        this.paint();
        this.dialog.showModal();
        document.documentElement.style.overflow = "hidden";

        // Scroll to the selected arrival month
        if (booking.start) {
            const key = `${booking.start.getFullYear()}-${booking.start.getMonth()}`;
            const month = this.querySelector(`[data-month="${key}"]`);
            if (month) this.months.scrollTop = month.offsetTop;
        }
    }

    close() {
        if (this.dialog?.open) this.dialog.close();
    }

    buildMonths() {
        const pricing = this.config.pricing;
        const today = startOfToday();
        let html = "";

        for (let m = 0; m < MONTHS_SHOWN; m++) {
            const first = new Date(today.getFullYear(), today.getMonth() + m, 1);
            const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
            const lead = (first.getDay() + 6) % 7; // Monday first

            let days = "<span></span>".repeat(lead);
            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(first.getFullYear(), first.getMonth(), d);
                const price = pricing ? getNightlyPrice(date, pricing) : null;
                days += `
                    <button type="button" class="pav-day" data-time="${date.getTime()}" data-key="${toDateKey(date)}" data-price="${price ?? ""}">
                        <span>${d}</span><small>${price != null ? `${price}€` : ""}</small>
                    </button>`;
            }

            html += `
                <section class="pt-5" data-month="${first.getFullYear()}-${first.getMonth()}">
                    <h3 class="mb-2 px-1 text-base font-bold first-letter:uppercase">${monthTitle.format(first)}</h3>
                    <div class="grid grid-cols-7 text-center text-xs font-semibold text-pav-muted" aria-hidden="true">
                        ${WEEKDAYS.map((w) => `<span class="py-1.5">${w}</span>`).join("")}
                    </div>
                    <div class="mt-1 grid grid-cols-7 gap-y-0.5">${days}</div>
                </section>`;
        }

        this.months.innerHTML = html;
        this.days = [...this.months.querySelectorAll(".pav-day")];
        this.built = true;
    }

    /** "Il semble que…" card when no arrival is possible soon, otherwise the stay rules. */
    renderNotice() {
        const contact = this.config.contact || {};
        const rules = this.config.stayRules || [];

        if (booking.fullUntil !== null && !booking.start) {
            const until = booking.fullUntil
                ? `Il semble que la maison soit complète jusqu'au ${fmtLongDate(booking.fullUntil)}.`
                : "Il semble que la maison soit complète pour les mois à venir.";
            this.notice.innerHTML = `
                <div class="rounded-2xl bg-pav-navy p-5 text-white">
                    <div class="mb-3 flex items-center gap-3">
                        <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pav-yellow text-pav-navy"><i data-lucide="calendar-x" class="h-5 w-5"></i></span>
                        <p class="font-display text-[21px] leading-tight">${until}</p>
                    </div>
                    <p class="mb-4 text-sm leading-relaxed text-pav-muted-dark">Le calendrier en ligne est peut-être fermé : ${contact.name || "nous"} pourra vous indiquer d'éventuelles disponibilités.</p>
                    <div class="grid grid-cols-2 gap-2.5">
                        ${contact.phone ? `<a href="tel:${contact.phone.replace(/\s/g, "")}" class="pav-btn min-h-12 text-[15px]"><i data-lucide="phone" class="h-4 w-4"></i>Appeler</a>` : ""}
                        ${contact.email ? `<a href="mailto:${contact.email}" class="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-pav-navy-2 text-[15px] font-semibold"><i data-lucide="mail" class="h-4 w-4 text-pav-yellow"></i>Écrire</a>` : ""}
                    </div>
                    <button type="button" data-request class="mt-3 w-full py-2 text-center text-sm font-semibold underline">Envoyer une demande sans dates</button>
                </div>`;
            this.notice.querySelector("[data-request]").addEventListener("click", goToBookingForm);
        } else if (rules.length) {
            this.notice.innerHTML = `
                <div class="flex gap-3 rounded-xl border border-pav-yellow bg-[#FFF6D9] px-3.5 py-3 text-sm leading-relaxed">
                    <i data-lucide="info" class="mt-0.5 h-[18px] w-[18px] shrink-0"></i>
                    <ul class="flex flex-col gap-1">${rules.map((rule) => `<li>${ruleText(rule)}</li>`).join("")}</ul>
                </div>`;
        } else {
            this.notice.innerHTML = "";
        }
        this.notice.hidden = !this.notice.innerHTML;
        if (window.lucide) lucide.createIcons();
    }

    paint() {
        const today = startOfToday().getTime();
        const start = booking.start?.getTime();
        const end = booking.end?.getTime();
        const choosingDeparture = start != null && end == null;
        const departures = choosingDeparture ? booking.departuresFor(booking.start) : new Set();

        for (const button of this.days || []) {
            const time = Number(button.dataset.time);
            const date = new Date(time);
            const past = time < today;
            const booked = booking.booked.has(button.dataset.key);
            const isDeparture = departures.has(time);
            const selectable = isDeparture || booking.canArrive(date);
            const edge = time === start || time === end;
            const inRange = start != null && end != null && time > start && time < end;

            button.disabled = !selectable && !edge;
            button.dataset.state = edge ? "edge" : inRange ? "in" : isDeparture ? "departure" : "";
            button.classList.toggle("is-booked", booked && !past && !isDeparture);
            button.setAttribute("aria-pressed", String(edge));
            const price = button.dataset.price ? `, ${button.dataset.price} € la nuit` : "";
            const status = isDeparture ? ", départ possible" : button.disabled ? ", indisponible" : price;
            button.setAttribute("aria-label", `${fmtLongDate(date)}${status}`);
        }

        const estimate = booking.estimate();
        if (!booking.start) {
            this.hint.textContent = "Sélectionnez votre date d'arrivée";
        } else if (!booking.end) {
            const options = [...departures].slice(0, 3).map((t) => fmtShortDate(new Date(t)));
            this.hint.textContent = departures.size && departures.size <= 3
                ? `Départ possible : ${options.join(" ou ")}`
                : "Sélectionnez votre date de départ";
        } else {
            this.hint.textContent = `${estimate ? `${estimate.nights} nuits · ` : ""}${fmtShortDate(booking.start)} → ${fmtShortDate(booking.end)}`;
        }

        this.summary.innerHTML = estimate
            ? `<span class="block">${estimate.lines.map((l) => `${l.count} × ${fmtPrice(l.price)}`).join(" · ")}${estimate.cleaning ? ` · ménage ${fmtPrice(estimate.cleaning)}` : ""}</span>
               <strong class="font-display text-2xl font-normal text-pav-navy">${fmtPrice(estimate.nightlyTotal + estimate.cleaning)}</strong>`
            : "";
        this.confirmBtn.disabled = !booking.hasRange;
        this.renderNotice();
    }

    render() {
        this.innerHTML = `
            <dialog class="pav-sheet" aria-labelledby="pav-dates-title">
                <div class="flex h-full flex-col">
                    <div class="mx-auto mt-2.5 h-[5px] w-11 rounded-full bg-[#C9C2B4] md:hidden" aria-hidden="true"></div>
                    <div class="flex items-center justify-between px-5 pb-1 pt-2.5 md:px-8 md:pt-6">
                        <h2 id="pav-dates-title" class="font-display text-[32px] leading-none">Vos dates</h2>
                        <button type="button" data-close class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-pav-sand" aria-label="Fermer">
                            <i data-lucide="x" class="h-5 w-5"></i>
                        </button>
                    </div>
                    <p data-hint class="px-5 pb-3 text-sm text-pav-muted md:px-8" aria-live="polite"></p>
                    <div data-notice class="px-4 pb-3 md:px-8" hidden></div>
                    <div data-months class="relative min-h-0 flex-1 overflow-y-auto border-t border-pav-line px-3 pb-4 md:grid md:grid-cols-2 md:gap-x-10 md:px-8"></div>
                    <div class="flex flex-col gap-3 border-t border-pav-line bg-white px-5 pb-5 pt-3 md:flex-row md:items-center md:justify-between md:px-8 md:py-5">
                        <div data-summary class="flex items-end justify-between gap-3 text-[13px] leading-normal text-pav-muted md:block"></div>
                        <div class="flex items-center gap-3">
                            <button type="button" data-clear class="min-h-12 px-3 text-sm font-semibold underline">Effacer</button>
                            <button type="button" data-confirm class="pav-btn min-h-12 flex-1 md:flex-none">Valider ces dates</button>
                        </div>
                    </div>
                </div>
            </dialog>
        `;

        this.dialog = this.querySelector("dialog");
        this.months = this.querySelector("[data-months]");
        this.hint = this.querySelector("[data-hint]");
        this.notice = this.querySelector("[data-notice]");
        this.summary = this.querySelector("[data-summary]");
        this.confirmBtn = this.querySelector("[data-confirm]");

        this.months.addEventListener("click", (e) => {
            const day = e.target.closest(".pav-day");
            if (day && !day.disabled) booking.pick(new Date(Number(day.dataset.time)));
        });
        this.querySelector("[data-close]").addEventListener("click", () => this.close());
        this.querySelector("[data-clear]").addEventListener("click", () => booking.set({ start: null, end: null }));
        this.confirmBtn.addEventListener("click", () => this.close());

        // Click on the backdrop closes the sheet
        this.dialog.addEventListener("click", (e) => {
            if (e.target === this.dialog) this.close();
        });
        this.dialog.addEventListener("close", () => {
            document.documentElement.style.overflow = "";
        });
    }
}

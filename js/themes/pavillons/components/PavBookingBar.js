import { BaseComponent } from "../../../shared/BaseComponent.js";
import { booking, openDates } from "../store.js";
import { fmtPrice, fmtShortDate, minNightlyPrice } from "../helpers.js";

/** Mobile-only bar pinned to the bottom of the screen. */
export class PavBookingBar extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        this.unsubscribe = booking.subscribe(() => this.update());

        // Hide the bar while the hero (which has its own call to action) or the booking form is on screen
        const watched = ["top", "reserver"].map((id) => document.getElementById(id)).filter(Boolean);
        if (watched.length && "IntersectionObserver" in window) {
            const visible = new Set();
            this.observer = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) visible.add(entry.target);
                    else visible.delete(entry.target);
                }
                this.bar?.classList.toggle("is-hidden", visible.size > 0);
            }, { threshold: 0.3 });
            watched.forEach((el) => this.observer.observe(el));
        }
    }

    disconnectedCallback() {
        this.unsubscribe?.();
        this.observer?.disconnect();
    }

    update() {
        if (!this.bar) return;
        const text = this.querySelector("[data-text]");
        const action = this.querySelector("[data-action]");
        const estimate = booking.estimate();

        if (estimate) {
            text.innerHTML = `
                <span class="block truncate">${fmtShortDate(booking.start)} → ${fmtShortDate(booking.end)}</span>
                <strong class="text-lg font-semibold text-pav-navy">${fmtPrice(estimate.total)}</strong>`;
            action.textContent = this.config.labels?.contact?.form?.submit || "Envoyer la demande";
        } else {
            const min = minNightlyPrice(this.config.pricing);
            text.innerHTML = min != null ? `dès <strong class="text-lg font-semibold text-pav-navy">${fmtPrice(min)}</strong> / nuit` : "";
            action.textContent = this.config.labels?.nav?.book || "Réserver";
        }
    }

    render() {
        if (!this.config.contact) {
            this.style.display = "none";
            return;
        }

        this.innerHTML = `
            <div class="pav-bookbar fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-pav-sand bg-white px-5 py-3 text-pav-navy shadow-[0_-8px_24px_-12px_rgba(12,24,35,.35)] md:hidden">
                <div data-text class="min-w-0 text-sm text-pav-muted"></div>
                <button type="button" data-action class="pav-btn shrink-0 px-5"></button>
            </div>
        `;
        this.bar = this.querySelector(".pav-bookbar");

        this.querySelector("[data-action]").addEventListener("click", () => {
            if (!booking.hasRange) {
                openDates();
                return;
            }
            document.getElementById("reserver")?.scrollIntoView({ behavior: "smooth" });
            setTimeout(() => document.querySelector('#reserver input[name="name"]')?.focus({ preventScroll: true }), 600);
        });
        this.update();
    }
}

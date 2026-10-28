import { BaseComponent } from "../../../shared/BaseComponent.js";
import { sendBookingRequest, buildMailtoLink } from "../../../shared/booking.js";
import { booking, openDates } from "../store.js";
import { fmtLongDate, fmtOptionPrice, fmtPrice, fmtShortDate, sectionHeader } from "../helpers.js";

export class PavContact extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        this.unsubscribe = booking.subscribe(() => this.updateBooking());
    }

    disconnectedCallback() {
        this.unsubscribe?.();
    }

    updateBooking() {
        const estimateEl = this.querySelector("[data-estimate]");
        if (!estimateEl) return;

        this.querySelector("[data-arrival]").textContent = booking.start ? fmtShortDate(booking.start) : "Choisir";
        this.querySelector("[data-departure]").textContent = booking.end ? fmtShortDate(booking.end) : "Choisir";

        const guestsEl = this.querySelector("[data-guests]");
        if (guestsEl) {
            const max = this.config.house_config.maxGuests;
            guestsEl.textContent = booking.guests;
            this.querySelector("[data-guests-minus]").disabled = booking.guests <= 1;
            this.querySelector("[data-guests-plus]").disabled = booking.guests >= max;
        }

        const estimate = booking.estimate();
        if (estimate) {
            const row = (label, amount) => `<div class="flex justify-between gap-3"><span>${label}</span><span>${amount}</span></div>`;
            estimateEl.innerHTML = `
                <div class="flex flex-col gap-2 text-sm">
                    ${estimate.lines.map((l) => row(`${l.count} nuit${l.count > 1 ? "s" : ""} × ${fmtPrice(l.price)}`, fmtPrice(l.count * l.price))).join("")}
                    ${estimate.cleaning ? row("Frais de ménage", fmtPrice(estimate.cleaning)) : ""}
                    ${estimate.options.map((o) => row(o.name, fmtPrice(o.amount))).join("")}
                    <div class="mt-1 flex items-baseline justify-between gap-3 border-t border-white/10 pt-3">
                        <span class="font-semibold text-white">Total estimé</span>
                        <strong class="font-display text-2xl font-normal text-white">${fmtPrice(estimate.total)}</strong>
                    </div>
                </div>`;
        } else if (booking.fullUntil !== null) {
            estimateEl.textContent = booking.fullUntil
                ? `Il semble que la maison soit complète jusqu'au ${fmtLongDate(booking.fullUntil)} : indiquez vos dates souhaitées dans votre message.`
                : "Il semble que la maison soit complète pour les mois à venir : indiquez vos dates souhaitées dans votre message.";
        } else {
            estimateEl.textContent = "Sélectionnez vos dates pour obtenir une estimation.";
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const submitBtn = form.querySelector('button[type="submit"]');
        const errorEl = this.querySelector("[data-error]");
        const label = submitBtn.textContent;
        const formData = new FormData(form);
        const estimate = booking.estimate();

        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            message: formData.get("message"),
            website: formData.get("website") || "",
            arrival: booking.start ? fmtLongDate(booking.start) : "",
            departure: booking.end ? fmtLongDate(booking.end) : "",
            price_estimation: estimate ? fmtPrice(estimate.total) : "Non calculé",
        };
        // Optional fields (ignored by PocketBase instances without the 1792966000 / 1793100000 migrations)
        const phone = formData.get("phone")?.trim();
        if (phone) data.phone = phone;
        if (booking.guests) data.guests = booking.guests;
        const options = booking.selectedOptions();
        if (options.length) {
            data.options = options.map((o) => ({
                name: o.name,
                price: o.price,
                unit: o.unit,
                amount: estimate?.options.find((e) => e.id === o.id)?.amount ?? null,
            }));
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi en cours…";
        errorEl.classList.add("hidden");

        try {
            await sendBookingRequest(data);
            this.renderSuccess(data, estimate);
            form.reset();
            form.classList.add("hidden");
            this.querySelector("[data-success]").classList.replace("hidden", "flex");
            booking.set({ start: null, end: null, options: new Set() });
            this.querySelector("#reserver").scrollIntoView({ behavior: "smooth" });
        } catch (error) {
            console.error("Submission Error:", error);
            const summary = [
                data.phone ? `Téléphone : ${data.phone}` : "",
                data.guests ? `${data.guests} voyageurs` : "",
                ...options.map((o) => o.name),
            ].filter(Boolean).join(", ");
            const mailData = summary ? { ...data, message: `${data.message}\n\n${summary}` } : data;
            errorEl.innerHTML = `L'envoi a échoué. <a href="${buildMailtoLink(this.config.contact.email, mailData)}" class="font-semibold underline">Envoyer la demande par email</a>`;
            errorEl.classList.remove("hidden");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = label;
        }
    }

    /** Recap of the request just sent (the booking state is cleared right after). */
    renderSuccess(data, estimate) {
        const labels = this.config.labels.contact || {};
        const owner = this.config.contact.name || "Nous";
        const row = (label, value) => `
            <div class="flex justify-between gap-4 border-t border-white/10 py-3 first:border-0">
                <dt class="text-pav-muted-dark">${label}</dt><dd class="text-right font-semibold">${value}</dd>
            </div>`;
        const rows = [
            booking.hasRange ? row("Dates", `${fmtShortDate(booking.start)} → ${fmtShortDate(booking.end)}`) : row("Dates", "À préciser"),
            estimate ? row("Durée", `${estimate.nights} nuit${estimate.nights > 1 ? "s" : ""}`) : "",
            data.guests ? row("Voyageurs", data.guests) : "",
            ...(estimate?.options || []).map((option) => row(option.name, fmtPrice(option.amount))),
            estimate ? row("Total estimé", fmtPrice(estimate.total)) : "",
        ].join("");

        this.querySelector("[data-success-recap]").innerHTML = rows;
        this.querySelector("[data-success-text]").textContent =
            `${owner} vous répond ${labels.responseTime || "très rapidement"} à l'adresse ${data.email} pour confirmer la disponibilité.`;
    }

    render() {
        if (!this.config.contact || !this.config.labels) {
            this.style.display = "none";
            return;
        }

        const { contact: labels, nav } = this.config.labels;
        const contact = this.config.contact;
        const form = labels.form || {};
        const maxGuests = this.config.house_config?.maxGuests;
        const bookingOptions = this.config.bookingOptions || [];

        const contactLinks = `
            <div class="flex flex-col gap-3">
                ${contact.phone ? `
                    <a href="tel:${contact.phone.replace(/\s/g, "")}" class="flex min-h-[56px] items-center gap-3 rounded-xl bg-pav-navy-2 px-4 py-3 transition-colors hover:bg-[#1E3449]">
                        <i data-lucide="phone" class="h-5 w-5 shrink-0 text-pav-yellow"></i>
                        <span><span class="block text-xs text-pav-muted-dark">${labels.phone?.title || ""}</span><span class="block font-semibold">${contact.phone}</span></span>
                    </a>` : ""}
                ${contact.email ? `
                    <a href="mailto:${contact.email}" class="flex min-h-[56px] items-center gap-3 rounded-xl bg-pav-navy-2 px-4 py-3 transition-colors hover:bg-[#1E3449]">
                        <i data-lucide="mail" class="h-5 w-5 shrink-0 text-pav-yellow"></i>
                        <span class="min-w-0"><span class="block text-xs text-pav-muted-dark">${labels.email?.title || ""}</span><span class="block break-all font-semibold">${contact.email}</span></span>
                    </a>` : ""}
            </div>
        `;

        const guestsField = maxGuests ? `
            <div class="flex items-center justify-between gap-3">
                <div>
                    <p id="pav-guests-label" class="font-semibold">Voyageurs</p>
                    <p class="text-[13px] text-pav-muted-dark">${maxGuests} personnes maximum</p>
                </div>
                <div class="flex items-center gap-3.5" role="group" aria-labelledby="pav-guests-label">
                    <button type="button" data-guests-minus class="pav-stepper" aria-label="Retirer un voyageur"><i data-lucide="minus" class="h-[18px] w-[18px]"></i></button>
                    <span data-guests class="min-w-[1.25rem] text-center text-lg font-semibold" aria-live="polite"></span>
                    <button type="button" data-guests-plus class="pav-stepper" aria-label="Ajouter un voyageur"><i data-lucide="plus" class="h-[18px] w-[18px]"></i></button>
                </div>
            </div>` : "";

        const optionsField = bookingOptions.length ? `
            <fieldset class="flex flex-col gap-2.5">
                <legend class="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-pav-muted-dark">Options</legend>
                ${bookingOptions.map((option) => `
                    <label class="pav-option">
                        <input type="checkbox" data-option="${option.id}" class="peer sr-only">
                        <span class="pav-check" aria-hidden="true"><i data-lucide="check" class="h-3.5 w-3.5"></i></span>
                        <span class="flex-1">
                            <span class="block font-semibold">${option.name}</span>
                            ${option.description ? `<span class="block text-[13px] leading-snug text-pav-muted-dark">${option.description}</span>` : ""}
                        </span>
                        <span class="whitespace-nowrap text-sm font-semibold">${fmtOptionPrice(option)}</span>
                    </label>
                `).join("")}
            </fieldset>` : "";

        this.innerHTML = `
            <section id="reserver" class="bg-pav-navy py-20 text-white md:py-32">
                <div class="mx-auto max-w-[1360px] px-5 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-start md:gap-16 md:px-10">
                    <div>
                        ${sectionHeader({ num: "06", eyebrow: nav.book, title: labels.title, dark: true })}
                        <p class="-mt-3 mb-8 text-[15px] leading-relaxed text-pav-muted-dark md:-mt-6 md:mb-10 md:text-lg">
                            ${(labels.subtitle || "").replace("{name}", contact.name || "")}
                        </p>
                        <div class="hidden md:block">${contactLinks}</div>
                    </div>

                    <div class="pav-reveal">
                        <form data-form class="flex flex-col gap-5">
                            <!-- Anti-spam: left empty by people, filled by most bots (checked by pb_hooks/on_message_guard.pb.js) -->
                            <div aria-hidden="true" style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden">
                                <label>Site web <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
                            </div>
                            <div class="flex flex-col gap-4 rounded-2xl bg-pav-navy-2 p-5">
                                <button type="button" data-open-dates class="grid grid-cols-2 overflow-hidden rounded-[10px] bg-white text-left text-pav-navy" aria-label="Choisir les dates du séjour">
                                    <span class="border-r border-pav-sand px-3.5 py-3">
                                        <span class="block text-xs font-semibold text-pav-muted">${form.arrival || "Arrivée"}</span>
                                        <span data-arrival class="block font-semibold">Choisir</span>
                                    </span>
                                    <span class="px-3.5 py-3">
                                        <span class="block text-xs font-semibold text-pav-muted">${form.departure || "Départ"}</span>
                                        <span data-departure class="block font-semibold">Choisir</span>
                                    </span>
                                </button>
                                ${guestsField}
                            </div>
                            ${optionsField}
                            <div data-estimate class="rounded-2xl border border-white/10 p-5 text-sm leading-relaxed text-pav-muted-dark" aria-live="polite"></div>
                            <label class="pav-field">${form.name || "Nom"}
                                <input type="text" name="name" required autocomplete="name" maxlength="120">
                            </label>
                            <label class="pav-field">${form.email || "Email"}
                                <input type="email" name="email" required autocomplete="email">
                            </label>
                            <label class="pav-field"><span>${form.phone || "Téléphone"} <span class="font-normal text-pav-muted-dark">(facultatif)</span></span>
                                <input type="tel" name="phone" autocomplete="tel" inputmode="tel" maxlength="40">
                            </label>
                            <label class="pav-field">${form.message || "Message"}
                                <textarea name="message" rows="4" required maxlength="5000" placeholder="Bonjour, je souhaiterais réserver…"></textarea>
                            </label>
                            <p data-error class="hidden rounded-lg bg-[#3A1F24] p-4 text-sm leading-relaxed" role="alert"></p>
                            <button type="submit" class="pav-btn mt-2 min-h-14 text-base">${form.submit || "Envoyer"}</button>
                            <p class="text-center text-[13px] text-pav-muted-dark">Prix indicatif, confirmation par email.</p>
                        </form>

                        <div data-success class="hidden flex-col items-center rounded-2xl bg-pav-navy-2 px-6 py-12 text-center" role="status">
                            <span class="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-pav-yellow text-pav-navy"><i data-lucide="check" class="h-8 w-8"></i></span>
                            <h3 class="pav-h3">Demande envoyée !</h3>
                            <p data-success-text class="mt-3 max-w-md text-pav-muted-dark"></p>
                            <dl data-success-recap class="mt-7 w-full max-w-sm rounded-xl bg-pav-navy px-5 py-2 text-left text-sm"></dl>
                            <p class="mt-4 text-[13px] text-pav-muted-dark">Prix indicatif : rien n'est réservé avant la confirmation.</p>
                            <button type="button" data-reset class="mt-8 rounded-lg border border-white/25 px-6 py-3 font-semibold transition-colors hover:bg-white/10">Envoyer une autre demande</button>
                        </div>
                    </div>

                    <div class="mt-12 border-t border-white/10 pt-8 md:hidden">
                        <p class="mb-4 text-sm text-pav-muted-dark">Une question ?</p>
                        ${contactLinks}
                    </div>
                </div>
            </section>
        `;

        this.querySelector("[data-form]").addEventListener("submit", (e) => this.handleSubmit(e));
        this.querySelector("[data-open-dates]").addEventListener("click", openDates);
        this.querySelector("[data-reset]").addEventListener("click", () => {
            this.querySelector("[data-success]").classList.replace("flex", "hidden");
            this.querySelector("[data-form]").classList.remove("hidden");
        });
        if (maxGuests) {
            this.querySelector("[data-guests-minus]").addEventListener("click", () => booking.set({ guests: Math.max(1, booking.guests - 1) }));
            this.querySelector("[data-guests-plus]").addEventListener("click", () => booking.set({ guests: Math.min(maxGuests, booking.guests + 1) }));
        }
        this.querySelectorAll("[data-option]").forEach((input) => {
            input.addEventListener("change", () => booking.toggleOption(input.dataset.option, input.checked));
        });
        this.updateBooking();
    }
}

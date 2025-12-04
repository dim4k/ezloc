import { BaseComponent } from "./BaseComponent.js";
import { parseICal, calculatePrice } from "../utils/BookingUtils.js";
import { PB_URL } from "../cms.js";

export class ContactSection extends BaseComponent {
    constructor() {
        super();
        this.bookedDates = [];
    }

    connectedCallback() {
        super.connectedCallback();
        this.fetchAvailability();
    }

    async fetchAvailability() {
        const calendarUrl = this.config.general.airbnbCalendarUrl;
        if (!calendarUrl) return;

        try {
            // Use local PocketBase proxy to avoid CORS and external dependency issues
            const proxyUrl = `${PB_URL}/api/ical-proxy?url=${encodeURIComponent(
                calendarUrl
            )}&t=${Date.now()}`;
            
            const response = await fetch(proxyUrl);
            
            if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
            
            // The proxy returns raw text (iCal format), not JSON with a 'contents' field like allorigins
            const icalData = await response.text();

            if (icalData && icalData.includes("BEGIN:VCALENDAR")) {
                this.bookedDates = parseICal(icalData);
                console.log(`📅 Calendar parsed: ${this.bookedDates.length} booked days found.`);
                this.updateCalendarDates();
            }
        } catch (error) {
            console.error("Error fetching Airbnb calendar:", error);
            // Even on error, the calendar is already initialized, so the user can still use the form.
        }
    }

    updatePriceDisplay(priceDetails) {
        const priceContainer = this.querySelector("#price-estimation");
        if (!priceContainer) return;

        if (!priceDetails) {
            priceContainer.classList.add("hidden");
            return;
        }

        priceContainer.innerHTML = `
            <div class="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
                <h3 class="font-serif text-xl font-bold text-breizh-navy mb-4">Estimation du séjour</h3>
                <div class="flex justify-between text-slate-600">
                    <span>${priceDetails.nights} nuits</span>
                    <span>${priceDetails.nightlyTotal}€</span>
                </div>
                <div class="flex justify-between text-slate-600">
                    <span>Frais de ménage</span>
                    <span>${priceDetails.cleaning}€</span>
                </div>
                <div class="border-t border-slate-200 pt-3 mt-3 flex justify-between font-bold text-lg text-breizh-navy">
                    <span>Total</span>
                    <span>${priceDetails.total}€</span>
                </div>
                <p class="text-xs text-slate-400 mt-2 text-center">Prix indicatif, confirmation par email.</p>
            </div>
        `;
        priceContainer.classList.remove("hidden");
    }

    initCalendars() {
        const arrivalInput = this.querySelector("#arrival-date");
        const departureInput = this.querySelector("#departure-date");

        if (!arrivalInput || !window.flatpickr) return;

        // Create a hidden input to hold the actual Flatpickr instance
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.className = "hidden"; // Ensure it stays hidden
        this.appendChild(hiddenInput);

        const commonConfig = {
            locale: "fr",
            dateFormat: "Y-m-d",
            minDate: "today",
            disable: [], // Initially empty, updated later
            disableMobile: false, // Force custom UI on mobile
            mode: "range",
            showMonths: window.innerWidth > 768 ? 2 : 1,
            positionElement: arrivalInput, // Position the calendar under the arrival input
            onChange: (selectedDates, dateStr, instance) => {
                if (selectedDates.length > 0) {
                    arrivalInput.value = instance.formatDate(selectedDates[0], "j F Y");
                } else {
                    arrivalInput.value = "";
                }
                
                if (selectedDates.length === 2) {
                    departureInput.value = instance.formatDate(selectedDates[1], "j F Y");
                    
                    // Calculate and display price
                    const priceDetails = calculatePrice(selectedDates[0], selectedDates[1], this.config.general.pricing);
                    this.updatePriceDisplay(priceDetails);
                } else {
                    departureInput.value = "";
                    this.updatePriceDisplay(null);
                }
            },
        };

        // Store instance to update it later
        this.fp = flatpickr(hiddenInput, commonConfig);

        // Bind clicks on visible inputs to open the hidden calendar
        const openCalendar = () => {
            this.fp.open();
        };

        arrivalInput.addEventListener("click", openCalendar);
        arrivalInput.setAttribute("readonly", true);

        if (departureInput) {
            departureInput.addEventListener("click", openCalendar);
            departureInput.setAttribute("readonly", true);
        }
    }

    updateCalendarDates() {
        if (!this.fp) return;

        // Convert dates to YYYY-MM-DD strings
        const disabledDates = this.bookedDates.map(d => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        });

        this.fp.set('disable', disabledDates);
    }

    async handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnContent = submitBtn.innerHTML;
        
        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin mr-2"></i> Envoi en cours...';
        lucide.createIcons();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Check Captcha
        if (this.config.general.captchaSiteKey) {
            const token = formData.get('cf-turnstile-response');
            if (!token) {
                alert("Veuillez valider le captcha.");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
                lucide.createIcons();
                return;
            }
            data.captchaToken = token;
        }
        
        // Get price estimation if available
        const priceContainer = this.querySelector("#price-estimation");
        let priceText = "Non calculé";
        if (priceContainer && !priceContainer.classList.contains("hidden")) {
            const totalEl = priceContainer.querySelector(".border-t span:last-child");
            if (totalEl) priceText = totalEl.textContent;
        }

        // Add price to data
        data.price_estimation = priceText;

        // Add price to data
        data.price_estimation = priceText;

        try {
            // Send to PocketBase
            // We use the PB_URL from cms.js 
            
            const response = await fetch(`${PB_URL}/api/collections/messages/records`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                // Success
                // Hide form, show success message
                form.classList.add("hidden");
                const successMsg = this.querySelector("#success-message");
                successMsg.classList.remove("hidden");
                lucide.createIcons(); // Re-render icons in success message
                
                form.reset();
                this.updatePriceDisplay(null); // Reset price display
            } else {
                throw new Error("PocketBase submission failed");
            }
            
        } catch (error) {
            console.error("Submission Error:", error);
            alert("Une erreur est survenue lors de l'envoi. Nous allons ouvrir votre client mail par défaut.");
            this.openMailto(data, priceText);
        }

        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
        lucide.createIcons();
    }

    openMailto(data, priceText) {
        const subject = `Demande de réservation - ${data.name}`;
        const body = `Bonjour,

Je souhaiterais réserver un séjour.

Voici les détails de ma demande :
- Nom : ${data.name}
- Email : ${data.email}
- Arrivée : ${this.querySelector("#arrival-date").value}
- Départ : ${this.querySelector("#departure-date").value}
- Estimation prix : ${priceText}

Message :
${data.message}

Cordialement,
${data.name}`;

        const mailtoLink = `mailto:${this.config.general.bookingEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    }

    render() {
        const { contact } = this.config.labels;
        this.innerHTML = `
            <section id="contact" class="py-24 bg-sand/30" data-aos="fade-up">
                <div class="max-w-4xl mx-auto px-4 sm:px-6">
                    <div class="text-center mb-16">
                        <h2 class="text-4xl font-serif text-breizh-navy font-bold">${
                            contact.title
                        }</h2>
                        <p class="mt-4 text-slate-600">${contact.subtitle.replace(
                            "{name}",
                            this.config.general.contactName
                        )}</p>
                    </div>

                    <div class="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-slate-100" data-aos="fade-up">
                            <div id="success-message" class="hidden text-center py-12 space-y-6">
                                <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <i data-lucide="check" class="w-10 h-10 text-green-600"></i>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-serif font-bold text-breizh-navy mb-2">Demande envoyée !</h3>
                                    <p class="text-slate-600 max-w-md mx-auto">
                                        Merci de nous avoir contactés. Nous avons bien reçu votre demande et nous reviendrons vers vous très rapidement.
                                    </p>
                                </div>
                                <button type="button" id="reset-form" class="inline-flex items-center justify-center px-8 py-3 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors font-bold">
                                    Envoyer une autre demande
                                </button>
                            </div>

                            <form id="booking-form" class="space-y-6 transition-all duration-300">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-bold text-breizh-navy mb-2">${
                                            contact.form.name
                                        }</label>
                                        <input type="text" name="name" required class="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-breizh-blue focus:ring-breizh-blue transition-colors bg-slate-50" placeholder="Votre nom">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold text-breizh-navy mb-2">${
                                            contact.form.email
                                        }</label>
                                        <input type="email" name="email" required class="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-breizh-blue focus:ring-breizh-blue transition-colors bg-slate-50" placeholder="votre@email.com">
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                    <div>
                                        <label class="block text-sm font-bold text-breizh-navy mb-2">${
                                            contact.form.arrival
                                        }</label>
                                        <input type="text" id="arrival-date" name="arrival" class="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-breizh-blue focus:ring-breizh-blue bg-slate-50" placeholder="Sélectionnez une date">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold text-breizh-navy mb-2">${
                                            contact.form.departure
                                        }</label>
                                        <input type="text" id="departure-date" name="departure" class="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-breizh-blue focus:ring-breizh-blue bg-slate-50" placeholder="Sélectionnez une date">
                                    </div>
                                </div>

                                <!-- Price Estimation Container -->
                                <div id="price-estimation" class="hidden transition-all duration-300 ease-in-out"></div>

                                <div>
                                    <label class="block text-sm font-bold text-breizh-navy mb-2">${
                                        contact.form.message
                                    }</label>
                                    <textarea name="message" rows="4" class="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-breizh-blue focus:ring-breizh-blue bg-slate-50" placeholder="Bonjour, je souhaiterais réserver..."></textarea>
                                </div>

                                <div class="text-center pt-4">
                                    <button type="submit" class="inline-flex items-center justify-center px-8 py-4 btn-primary rounded-full transform hover:-translate-y-1 transition-all shadow-lg hover:shadow-xl text-white font-bold">
                                        ${contact.form.submit}
                                        <i data-lucide="send" class="ml-2 w-5 h-5"></i>
                                    </button>
                                </div>
                                
                                <!-- Captcha Container -->
                                <div id="captcha-container" class="flex justify-center mt-4"></div>
                            </form>

                        <!-- Pricing Conditions -->
                        <div class="mt-12 pt-12 border-t border-slate-100">
                            <h3 class="font-serif text-xl font-bold text-breizh-navy mb-6 flex items-center gap-2">
                                <i data-lucide="info" class="w-5 h-5 text-breizh-blue"></i>
                                Conditions de location
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${this.config.pricing.details.map(detail => `
                                    <div class="flex items-start gap-3 text-slate-600 text-sm bg-slate-50 p-4 rounded-lg">
                                        <i data-lucide="check-circle" class="w-4 h-4 text-breizh-blue flex-shrink-0 mt-0.5"></i>
                                        <span>${detail}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Phone CTA Below Form -->
                    <div class="mt-8 pt-8 border-t-2 border-slate-100">
                        <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <!-- Phone -->
                            <a href="tel:${this.config.general.bookingPhone.replace(/\s/g, "")}" class="inline-flex items-center gap-3 px-8 py-4 bg-white border-2 border-breizh-blue text-breizh-blue rounded-full hover:bg-breizh-blue hover:text-white transition-all group shadow-sm hover:shadow-md">
                                <i data-lucide="phone" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                                <div class="text-left">
                                    <p class="text-xs uppercase tracking-wider opacity-80 font-bold">${contact.phone.title}</p>
                                    <p class="font-bold text-lg">${this.config.general.bookingPhone}</p>
                                </div>
                            </a>
                            
                            <!-- Email -->
                            <a href="mailto:${this.config.general.bookingEmail}" class="inline-flex items-center gap-3 px-8 py-4 bg-breizh-blue/10 text-breizh-navy font-bold rounded-full hover:bg-breizh-blue/20 transition-all border-2 border-breizh-blue hover:-translate-y-1 transform">
                                <i data-lucide="mail" class="w-6 h-6"></i>
                                <div class="text-left">
                                    <p class="text-xs uppercase tracking-wider opacity-80">${contact.email.title}</p>
                                    <p>${this.config.general.bookingEmail}</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        `;
        
        // Bind form submission
        this.querySelector("#booking-form").addEventListener("submit", this.handleSubmit.bind(this));

        // Bind reset button
        this.querySelector("#reset-form").addEventListener("click", () => {
            this.querySelector("#success-message").classList.add("hidden");
            this.querySelector("#booking-form").classList.remove("hidden");
        });

        // Initialize calendars immediately
        setTimeout(() => this.initCalendars(), 0);

        // Initialize Turnstile
        if (this.config.general.captchaSiteKey) {
            this.initTurnstile();
        }
    }

    initTurnstile() {
        // Check if script is already loaded
        if (!document.querySelector('script[src*="turnstile"]')) {
            const script = document.createElement('script');
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
            
            script.onload = () => {
                this.renderTurnstile();
            };
        } else {
            this.renderTurnstile();
        }
    }

    renderTurnstile() {
        if (window.turnstile) {
            window.turnstile.render('#captcha-container', {
                sitekey: this.config.general.captchaSiteKey,
                theme: 'light',
            });
        } else {
            // Retry if not ready
            setTimeout(() => this.renderTurnstile(), 100);
        }
    }
}

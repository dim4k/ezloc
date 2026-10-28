/**
 * PAVILLONS — booking state shared by the hero, the dates sheet,
 * the contact form and the mobile booking bar.
 */
import { SITE_CONFIG } from "../../cms.js";
import { fetchBookedDates, toDateKey } from "../../shared/booking.js";
import { getNightlyPrice, getOptionAmount, getRulesForNight } from "../../utils/BookingUtils.js";

// Longest stay offered by the dates picker
const MAX_STAY_NIGHTS = 90;
// Beyond this delay before the first possible arrival, the calendar is considered full
const FULL_THRESHOLD_DAYS = 30;
const SEARCH_DAYS = 730;

const listeners = new Set();
const departuresCache = new Map();

const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export const booking = {
    start: null,
    end: null,
    booked: new Set(),
    guests: SITE_CONFIG.house_config?.maxGuests ? Math.min(2, SITE_CONFIG.house_config.maxGuests) : null,
    options: new Set(),
    // First possible arrival when it is far away (or `false` if none within two years)
    fullUntil: null,

    get hasRange() {
        return Boolean(this.start && this.end);
    },

    subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    set(patch) {
        if ("booked" in patch) departuresCache.clear();
        Object.assign(this, patch);
        listeners.forEach((listener) => listener(this));
    },

    isBooked(date) {
        return this.booked.has(toDateKey(date));
    },

    /**
     * Valid check-out dates (timestamps) for an arrival: every night must be free
     * and the stay must satisfy the stay rules covering its nights.
     */
    departuresFor(start) {
        const key = start.getTime();
        if (departuresCache.has(key)) return departuresCache.get(key);

        const rules = SITE_CONFIG.stayRules || [];
        const departures = new Set();
        const multiples = new Set();
        let minNights = 1;
        let night = start;

        for (let nights = 1; nights <= MAX_STAY_NIGHTS; nights++) {
            if (this.isBooked(night)) break;
            for (const rule of getRulesForNight(night, rules)) {
                if (rule.minNights) minNights = Math.max(minNights, rule.minNights);
                if (rule.nightsMultiple) multiples.add(rule.nightsMultiple);
            }
            const checkout = addDays(night, 1);
            if (nights >= minNights && [...multiples].every((m) => nights % m === 0)) {
                departures.add(checkout.getTime());
            }
            night = checkout;
        }

        departuresCache.set(key, departures);
        return departures;
    },

    canArrive(date) {
        return date >= startOfToday() && this.departuresFor(date).size > 0;
    },

    /** Applies a click on a calendar day (arrival first, then departure). */
    pick(date) {
        if (this.start && !this.end && this.departuresFor(this.start).has(date.getTime())) {
            this.set({ end: date });
        } else if (this.canArrive(date)) {
            this.set({ start: date, end: null });
        }
    },

    toggleOption(id, checked) {
        const options = new Set(this.options);
        if (checked) options.add(id);
        else options.delete(id);
        this.set({ options });
    },

    selectedOptions() {
        return (SITE_CONFIG.bookingOptions || []).filter((option) => this.options.has(option.id));
    },

    /** Price estimation of the selected stay: nights grouped by price, cleaning fee and options. */
    estimate() {
        const pricing = SITE_CONFIG.pricing;
        if (!this.hasRange || !pricing) return null;

        const byPrice = new Map();
        let nights = 0;
        for (let date = this.start; date < this.end; date = addDays(date, 1)) {
            const price = getNightlyPrice(date, pricing);
            byPrice.set(price, (byPrice.get(price) || 0) + 1);
            nights++;
        }
        const lines = [...byPrice].map(([price, count]) => ({ price, count }));
        const nightlyTotal = lines.reduce((sum, line) => sum + line.price * line.count, 0);
        const cleaning = pricing.cleaningFee || 0;
        const options = this.selectedOptions().map((option) => ({
            ...option,
            amount: getOptionAmount(option, nights, this.guests || 1),
        }));
        const optionsTotal = options.reduce((sum, option) => sum + option.amount, 0);

        return { nights, lines, nightlyTotal, cleaning, options, total: nightlyTotal + cleaning + optionsTotal };
    },
};

/** Looks for the first possible arrival to detect a (nearly) full calendar. */
function computeFullUntil() {
    const today = startOfToday();
    for (let i = 0; i < SEARCH_DAYS; i++) {
        const date = addDays(today, i);
        if (booking.canArrive(date)) return i > FULL_THRESHOLD_DAYS ? date : null;
    }
    return false;
}

/** Loads the Airbnb calendar once; the UI stays usable if it fails. */
export async function loadAvailability() {
    try {
        const dates = await fetchBookedDates();
        booking.set({ booked: new Set(dates.map(toDateKey)) });
        booking.set({ fullUntil: computeFullUntil() });
    } catch (error) {
        console.error("Error fetching Airbnb calendar:", error);
    }
}

export function openDates() {
    document.querySelector("pav-dates")?.open();
}

/** Closes the dates sheet and brings the visitor to the booking form. */
export function goToBookingForm() {
    document.querySelector("pav-dates")?.close();
    document.getElementById("reserver")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => document.querySelector('#reserver input[name="name"]')?.focus({ preventScroll: true }), 600);
}

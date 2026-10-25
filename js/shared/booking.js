/**
 * BOOKING SERVICES
 * Theme-independent logic shared by every booking form:
 * Airbnb availability (via the PocketBase iCal proxy) and request submission.
 */
import { PB_URL } from "../cms.js";
import { parseICal } from "../utils/BookingUtils.js";

/**
 * Formats a date as a local "YYYY-MM-DD" key.
 * @param {Date} date
 * @returns {string}
 */
export function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Fetches the booked days from the Airbnb calendar.
 * @param {string} calendarUrl - Airbnb iCal export URL.
 * @returns {Promise<Date[]>} Booked days (empty when no calendar is configured).
 */
export async function fetchBookedDates(calendarUrl) {
    if (!calendarUrl) return [];

    // Use local PocketBase proxy to avoid CORS and external dependency issues
    const proxyUrl = `${PB_URL}/api/ical-proxy?url=${encodeURIComponent(calendarUrl)}&t=${Date.now()}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);

    const icalData = await response.text();
    if (!icalData || !icalData.includes("BEGIN:VCALENDAR")) return [];

    const dates = parseICal(icalData);
    console.log(`📅 Calendar parsed: ${dates.length} booked days found.`);
    return dates;
}

/**
 * Stores a booking request in the `messages` collection.
 * @param {{name: string, email: string, arrival: string, departure: string, message: string, price_estimation: string}} data
 */
export async function sendBookingRequest(data) {
    const response = await fetch(`${PB_URL}/api/collections/messages/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("PocketBase submission failed");
}

/**
 * Builds a mailto: link carrying the booking request, used when submission fails.
 * @param {string} to - Owner's email address.
 * @param {Object} data - Same shape as sendBookingRequest().
 * @returns {string}
 */
export function buildMailtoLink(to, data) {
    const subject = `Demande de réservation - ${data.name}`;
    const body = `Bonjour,

Je souhaiterais réserver un séjour.

Voici les détails de ma demande :
- Nom : ${data.name}
- Email : ${data.email}
- Arrivée : ${data.arrival || ""}
- Départ : ${data.departure || ""}
- Estimation prix : ${data.price_estimation}

Message :
${data.message}

Cordialement,
${data.name}`;

    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

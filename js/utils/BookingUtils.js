/**
 * BOOKING UTILITIES
 * Contains logic for parsing iCal data and calculating prices.
 */

/**
 * Parses iCal data string into an array of Date objects representing booked days.
 * @param {string} icalData - The raw iCal string.
 * @returns {Date[]} Array of booked Date objects.
 */
export function parseICal(icalData) {
    const dates = [];
    const lines = icalData.split(/\r\n|\n|\r/);
    let inEvent = false;
    let dtStart = null;
    let dtEnd = null;

    for (const line of lines) {
        if (line.startsWith("BEGIN:VEVENT")) {
            inEvent = true;
            dtStart = null;
            dtEnd = null;
        } else if (line.startsWith("END:VEVENT")) {
            inEvent = false;
            if (dtStart && dtEnd) {
                let current = new Date(dtStart);
                const end = new Date(dtEnd);
                while (current < end) {
                    dates.push(new Date(current));
                    current.setDate(current.getDate() + 1);
                }
            }
        } else if (inEvent) {
            if (line.startsWith("DTSTART;VALUE=DATE:")) {
                const dateStr = line.split(":")[1];
                dtStart = new Date(
                    dateStr.substring(0, 4),
                    parseInt(dateStr.substring(4, 6)) - 1,
                    dateStr.substring(6, 8)
                );
            } else if (line.startsWith("DTEND;VALUE=DATE:")) {
                const dateStr = line.split(":")[1];
                dtEnd = new Date(
                    dateStr.substring(0, 4),
                    parseInt(dateStr.substring(4, 6)) - 1,
                    dateStr.substring(6, 8)
                );
            }
        }
    }
    return dates;
}

/**
 * Parses a "DD/MM" (or "DD-MM") period boundary.
 * @param {string} str - Period boundary string.
 * @returns {{day: number, month: number}} Day (1-31) and month (1-12).
 */
export function parsePeriodDay(str) {
    const [day, month] = String(str).split(/[/-]/).map(Number);
    return { day, month };
}

/**
 * Checks if a date is within a specific DD/MM period.
 * @param {Date} date - The date to check.
 * @param {string} startStr - Start date string "DD/MM".
 * @param {string} endStr - End date string "DD/MM".
 * @returns {boolean} True if date is in period.
 */
function isDateInPeriod(date, startStr, endStr) {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate(); // 1-31

    const { day: startDay, month: startMonth } = parsePeriodDay(startStr);
    const { day: endDay, month: endMonth } = parsePeriodDay(endStr);

    // Convert to comparable numbers (MMDD) for easier comparison
    const current = month * 100 + day;
    const start = startMonth * 100 + startDay;
    const end = endMonth * 100 + endDay;

    if (start <= end) {
        // Normal range (e.g. 01/06 to 31/08)
        return current >= start && current <= end;
    } else {
        // Wrap around range (e.g. 20/12 to 05/01)
        return current >= start || current <= end;
    }
}

/**
 * Stay rules (stay_rules collection) applying to the night starting on the given date.
 * @param {Date} date - The night's date.
 * @param {Array<{start: string, end: string, minNights: ?number, nightsMultiple: ?number}>} rules
 * @returns {Array} Matching rules.
 */
export function getRulesForNight(date, rules = []) {
    return rules.filter((rule) => isDateInPeriod(date, rule.start, rule.end));
}

/**
 * Price of a booking option for a stay.
 * @param {{price: number, unit: string}} option - unit: "stay" | "night" | "guest" | "guest_night".
 * @param {number} nights - Number of nights.
 * @param {number} guests - Number of guests.
 * @returns {number}
 */
export function getOptionAmount(option, nights, guests = 1) {
    const multiplier = {
        stay: 1,
        night: nights,
        guest: guests,
        guest_night: guests * nights,
    }[option.unit] ?? 1;
    return option.price * multiplier;
}

/**
 * Returns the price of the night starting on the given date.
 * @param {Date} date - The night's date.
 * @param {Object} pricingConfig - The pricing configuration object.
 * @returns {number} Nightly price.
 */
export function getNightlyPrice(date, pricingConfig) {
    if (pricingConfig.periods) {
        for (const period of pricingConfig.periods) {
            if (isDateInPeriod(date, period.start, period.end)) {
                return period.price; // Use the first matching period
            }
        }
    }
    return pricingConfig.defaultPrice;
}

/**
 * Calculates the price for a stay.
 * @param {Date} startDate - Check-in date.
 * @param {Date} endDate - Check-out date.
 * @param {Object} pricingConfig - The pricing configuration object.
 * @returns {Object|null} Price details or null if invalid config.
 */
export function calculatePrice(startDate, endDate, pricingConfig) {
    if (!pricingConfig) return null;

    let totalPrice = 0;
    let totalNights = 0;
    let currentDate = new Date(startDate);

    // Iterate through each night
    while (currentDate < endDate) {
        totalPrice += getNightlyPrice(currentDate, pricingConfig);
        totalNights++;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        nights: totalNights,
        nightlyTotal: totalPrice,
        cleaning: pricingConfig.cleaningFee,
        total: totalPrice + pricingConfig.cleaningFee
    };
}

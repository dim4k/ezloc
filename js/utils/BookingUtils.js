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
 * Checks if a date is within a specific DD/MM period.
 * @param {Date} date - The date to check.
 * @param {string} startStr - Start date string "DD/MM".
 * @param {string} endStr - End date string "DD/MM".
 * @returns {boolean} True if date is in period.
 */
function isDateInPeriod(date, startStr, endStr) {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate(); // 1-31
    
    // Parse DD/MM
    const [startDay, startMonth] = startStr.split("/").map(Number);
    const [endDay, endMonth] = endStr.split("/").map(Number);

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
        let nightlyPrice = pricingConfig.defaultPrice;

        // Check if date matches any specific period
        if (pricingConfig.periods) {
            for (const period of pricingConfig.periods) {
                if (isDateInPeriod(currentDate, period.start, period.end)) {
                    nightlyPrice = period.price;
                    break; // Use the first matching period
                }
            }
        }

        totalPrice += nightlyPrice;
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

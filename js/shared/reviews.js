/**
 * Guest reviews (collection "reviews"), shared by the themes.
 * The texts are plain text typed in the dashboard: escaped before going into innerHTML.
 */

const monthYear = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export const escapeHtml = (text) => String(text ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Review text → one <p> per line. */
export const reviewParagraphs = (text, className = "") => String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p${className ? ` class="${className}"` : ""}>${escapeHtml(line)}</p>`)
    .join("");

/** "2025-07-14 00:00:00.000Z" → "juillet 2025" */
export function reviewDate(value) {
    const match = /^(\d{4})-(\d{2})/.exec(value || "");
    return match ? monthYear.format(new Date(Number(match[1]), Number(match[2]) - 1, 1)) : "";
}

/** "juillet 2025 · Airbnb" */
export const reviewMeta = (review) => [reviewDate(review.date), review.source]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" · ");

/** Five stars, the first `rating` filled; nothing without a rating. */
export function starsHtml(rating, className = "") {
    if (!rating) return "";
    const stars = Array.from({ length: 5 }, (_, i) =>
        `<i data-lucide="star" class="h-4 w-4 ${i < rating ? "fill-current" : "opacity-25"}"></i>`).join("");
    return `<div class="flex gap-0.5 ${className}" role="img" aria-label="Note : ${rating} sur 5">${stars}</div>`;
}

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

/** Unfolds a long review; hidden until initReviews finds the text taller than the fold. */
export const moreButton = (className) =>
    `<button type="button" data-review-more hidden aria-expanded="false" class="${className}">Lire la suite</button>`;

/** Five stars, the first `rating` filled; nothing without a rating. */
export function starsHtml(rating, className = "") {
    if (!rating) return "";
    const stars = Array.from({ length: 5 }, (_, i) =>
        `<i data-lucide="star" class="h-4 w-4 ${i < rating ? "fill-current" : "opacity-25"}"></i>`).join("");
    return `<div class="flex gap-0.5 ${className}" role="img" aria-label="Note : ${rating} sur 5">${stars}</div>`;
}

const scrollBehavior = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/**
 * Behaviour of a reviews row: [data-reviews-track] scrolls one screen at a time with
 * [data-reviews-prev] / [data-reviews-next] (disabled at the ends, [data-reviews-controls] hidden
 * when every review fits), and the texts ([data-review-text]) taller than the fold get their
 * "Lire la suite" button (moreButton, right after the text).
 */
export function initReviews(root) {
    const track = root.querySelector("[data-reviews-track]");
    const controls = root.querySelector("[data-reviews-controls]");
    const prev = root.querySelector("[data-reviews-prev]");
    const next = root.querySelector("[data-reviews-next]");
    if (!track) return;

    const updateArrows = () => {
        const max = track.scrollWidth - track.clientWidth;
        controls?.classList.toggle("invisible", max <= 1);
        if (prev) prev.disabled = track.scrollLeft <= 1;
        if (next) next.disabled = track.scrollLeft >= max - 1;
    };

    // Folded only when it hides something (measured again when the width changes)
    const fold = () => {
        root.querySelectorAll("[data-review-text]").forEach((text) => {
            if (text.dataset.open === "true") return;
            text.classList.add("is-folded");
            const overflows = text.scrollHeight > text.clientHeight + 1;
            text.classList.toggle("is-folded", overflows);
            text.nextElementSibling.hidden = !overflows;
        });
    };

    prev?.addEventListener("click", () => track.scrollBy({ left: -track.clientWidth, behavior: scrollBehavior() }));
    next?.addEventListener("click", () => track.scrollBy({ left: track.clientWidth, behavior: scrollBehavior() }));
    track.addEventListener("scroll", updateArrows, { passive: true });

    root.addEventListener("click", (e) => {
        const button = e.target.closest("[data-review-more]");
        if (!button) return;
        const text = button.previousElementSibling;
        const open = text.classList.contains("is-folded");
        text.classList.toggle("is-folded", !open);
        text.dataset.open = String(open);
        button.setAttribute("aria-expanded", String(open));
        button.textContent = open ? "Réduire" : "Lire la suite";
    });

    new ResizeObserver(() => {
        fold();
        updateArrows();
    }).observe(track);
    // The web fonts change the line breaks without resizing the folded texts
    document.fonts?.ready.then(fold);
}

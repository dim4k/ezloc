import { BaseComponent } from "../../../shared/BaseComponent.js";
import { escapeHtml, initReviews, moreButton, reviewMeta, reviewParagraphs, starsHtml } from "../../../shared/reviews.js";
import { sectionHeader } from "../helpers.js";

const ARROW = "inline-flex h-12 w-12 items-center justify-center rounded-full border border-pav-line text-pav-navy transition-colors hover:bg-pav-navy hover:text-white disabled:pointer-events-none disabled:opacity-30";

export class PavReviews extends BaseComponent {
    render() {
        const reviews = this.config.reviews || [];
        if (reviews.length === 0 || !this.config.labels) {
            this.style.display = "none";
            return;
        }

        const { nav, reviews: labels = {} } = this.config.labels;

        // One row: 1 card and the next one peeking on phones, 2 on tablets, 3 on desktop.
        // Swiped on phones, arrows from tablets up
        this.innerHTML = `
            <section id="avis" class="bg-white py-20 md:py-32">
                <div class="mx-auto max-w-[1360px] md:px-10">
                    <div class="flex items-end justify-between gap-6 px-5 md:px-0">
                        ${sectionHeader({ num: "05", eyebrow: nav.reviews || "Avis", title: labels.title || "Ils ont séjourné ici" })}
                        <div data-reviews-controls class="mb-12 hidden shrink-0 gap-2 md:flex">
                            <button type="button" data-reviews-prev class="${ARROW}" aria-label="Avis précédents"><i data-lucide="chevron-left" class="h-5 w-5"></i></button>
                            <button type="button" data-reviews-next class="${ARROW}" aria-label="Avis suivants"><i data-lucide="chevron-right" class="h-5 w-5"></i></button>
                        </div>
                    </div>
                    <div data-reviews-track class="pav-reveal flex snap-x snap-mandatory items-start gap-3 overflow-x-auto scroll-px-5 px-5 md:gap-6 md:scroll-px-0 md:px-0">
                        ${reviews.map((review) => {
                            const meta = reviewMeta(review);
                            return `
                                <figure class="m-0 w-[85%] shrink-0 snap-start rounded-2xl bg-pav-chalk p-6 md:w-[calc((100%-1.5rem)/2)] md:p-8 lg:w-[calc((100%-3rem)/3)]">
                                    ${starsHtml(review.rating, "mb-4 text-pav-blue")}
                                    <blockquote data-review-text class="review-text space-y-3 text-[15px] leading-relaxed text-pav-ink md:text-base">
                                        ${reviewParagraphs(review.text)}
                                    </blockquote>
                                    ${moreButton("mt-3 text-sm font-semibold text-pav-blue underline underline-offset-4")}
                                    <figcaption class="mt-6 text-sm">
                                        <span class="block font-semibold text-pav-navy">${escapeHtml(review.author)}</span>
                                        ${meta ? `<span class="block text-pav-muted">${meta}</span>` : ""}
                                    </figcaption>
                                </figure>
                            `;
                        }).join("")}
                    </div>
                </div>
            </section>
        `;

        initReviews(this);
    }
}

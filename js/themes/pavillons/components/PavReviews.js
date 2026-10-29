import { BaseComponent } from "../../../shared/BaseComponent.js";
import { escapeHtml, reviewMeta, reviewParagraphs, starsHtml } from "../../../shared/reviews.js";
import { sectionHeader } from "../helpers.js";

export class PavReviews extends BaseComponent {
    render() {
        const reviews = this.config.reviews || [];
        if (reviews.length === 0 || !this.config.labels) {
            this.style.display = "none";
            return;
        }

        const { nav, reviews: labels = {} } = this.config.labels;

        // Phones: one card per swipe, the next one peeking. Larger screens: a grid
        this.innerHTML = `
            <section id="avis" class="bg-white py-20 md:py-32">
                <div class="mx-auto max-w-[1360px] md:px-10">
                    <div class="px-5 md:px-0">
                        ${sectionHeader({ num: "05", eyebrow: nav.reviews || "Avis", title: labels.title || "Ils ont séjourné ici" })}
                    </div>
                    <div class="pav-reveal pav-noscrollbar flex snap-x snap-mandatory items-start gap-3 overflow-x-auto scroll-px-5 px-5 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-3">
                        ${reviews.map((review) => {
                            const meta = reviewMeta(review);
                            return `
                                <figure class="m-0 w-[85%] shrink-0 snap-start rounded-2xl bg-pav-chalk p-6 md:w-auto md:p-8">
                                    ${starsHtml(review.rating, "mb-4 text-pav-blue")}
                                    <blockquote class="space-y-3 text-[15px] leading-relaxed text-pav-ink md:text-base">
                                        ${reviewParagraphs(review.text)}
                                    </blockquote>
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
    }
}

import { BaseComponent } from "../../../shared/BaseComponent.js";
import { escapeHtml, initReviews, moreButton, reviewMeta, reviewParagraphs, starsHtml } from "../../../shared/reviews.js";

const ARROW = "p-3 rounded-full bg-slate-50 border border-slate-200 text-breizh-navy hover:bg-breizh-blue hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none";

export class ReviewsSection extends BaseComponent {
    render() {
        const reviews = this.config.reviews || [];
        if (reviews.length === 0 || !this.config.labels) {
            this.style.display = 'none';
            return;
        }

        const labels = this.config.labels.reviews || {};

        // One row: 1 card and the next one peeking on phones, 2 on tablets, 3 on desktop
        this.innerHTML = `
            <section id="avis" class="py-24 bg-white border-t border-slate-200">
                <div class="max-w-7xl mx-auto px-4 sm:px-6">
                    <div class="text-center mb-16" data-aos="fade-up">
                        <i data-lucide="star" class="w-10 h-10 text-breizh-blue mx-auto mb-4"></i>
                        <h2 class="font-serif text-4xl text-breizh-navy font-bold">${labels.title || 'Avis de nos voyageurs'}</h2>
                        ${labels.subtitle ? `<p class="text-slate-600 mt-4">${labels.subtitle}</p>` : ''}
                        <div class="w-20 h-1 bg-accent mx-auto mt-6 rounded-full"></div>
                    </div>

                    <div data-aos="fade-up" data-aos-delay="100">
                        <div data-reviews-track class="flex snap-x snap-mandatory items-start gap-6 overflow-x-auto pb-2 -mx-4 px-4 scroll-px-4 sm:-mx-6 sm:px-6 sm:scroll-px-6">
                            ${reviews.map((review) => {
                                const meta = reviewMeta(review);
                                return `
                                    <figure class="w-[85%] shrink-0 snap-start bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]">
                                        ${starsHtml(review.rating, 'text-accent mb-4')}
                                        <blockquote data-review-text class="review-text space-y-3 text-slate-600 leading-relaxed">
                                            ${reviewParagraphs(review.text)}
                                        </blockquote>
                                        ${moreButton('mt-3 text-sm font-semibold text-breizh-blue hover:underline')}
                                        <figcaption class="mt-6 text-sm">
                                            <span class="block font-bold text-breizh-navy">${escapeHtml(review.author)}</span>
                                            ${meta ? `<span class="block text-slate-500">${meta}</span>` : ''}
                                        </figcaption>
                                    </figure>
                                `;
                            }).join('')}
                        </div>

                        <div data-reviews-controls class="flex justify-center gap-3 mt-8">
                            <button type="button" data-reviews-prev class="${ARROW}" aria-label="Avis précédents"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>
                            <button type="button" data-reviews-next class="${ARROW}" aria-label="Avis suivants"><i data-lucide="chevron-right" class="w-5 h-5"></i></button>
                        </div>
                    </div>
                </div>
            </section>
        `;

        initReviews(this);
    }
}

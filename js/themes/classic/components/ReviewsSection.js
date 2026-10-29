import { BaseComponent } from "../../../shared/BaseComponent.js";
import { escapeHtml, reviewMeta, reviewParagraphs, starsHtml } from "../../../shared/reviews.js";

export class ReviewsSection extends BaseComponent {
    render() {
        const reviews = this.config.reviews || [];
        if (reviews.length === 0 || !this.config.labels) {
            this.style.display = 'none';
            return;
        }

        const labels = this.config.labels.reviews || {};

        this.innerHTML = `
            <section id="avis" class="py-24 bg-white border-t border-slate-200">
                <div class="max-w-7xl mx-auto px-4 sm:px-6">
                    <div class="text-center mb-16" data-aos="fade-up">
                        <i data-lucide="star" class="w-10 h-10 text-breizh-blue mx-auto mb-4"></i>
                        <h2 class="font-serif text-4xl text-breizh-navy font-bold">${labels.title || 'Avis de nos voyageurs'}</h2>
                        ${labels.subtitle ? `<p class="text-slate-600 mt-4">${labels.subtitle}</p>` : ''}
                        <div class="w-20 h-1 bg-accent mx-auto mt-6 rounded-full"></div>
                    </div>

                    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-start">
                        ${reviews.map((review, index) => {
                            const meta = reviewMeta(review);
                            return `
                                <figure class="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm" data-aos="fade-up" data-aos-delay="${Math.min(index, 2) * 100}">
                                    ${starsHtml(review.rating, 'text-accent mb-4')}
                                    <blockquote class="space-y-3 text-slate-600 leading-relaxed">
                                        ${reviewParagraphs(review.text)}
                                    </blockquote>
                                    <figcaption class="mt-6 text-sm">
                                        <span class="block font-bold text-breizh-navy">${escapeHtml(review.author)}</span>
                                        ${meta ? `<span class="block text-slate-500">${meta}</span>` : ''}
                                    </figcaption>
                                </figure>
                            `;
                        }).join('')}
                    </div>
                </div>
            </section>
        `;
    }
}

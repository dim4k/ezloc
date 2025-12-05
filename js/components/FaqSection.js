import { BaseComponent } from "./BaseComponent.js";

export class FaqSection extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        this.handleClick = this.handleClick.bind(this);
        this.addEventListener('click', this.handleClick);
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.handleClick);
        super.disconnectedCallback();
    }

    handleClick(e) {
        const button = e.target.closest('button[aria-expanded]');
        if (!button) return;

        const expanded = button.getAttribute('aria-expanded') === 'true';
        const content = button.nextElementSibling;
        const icon = button.querySelector('[data-lucide="chevron-down"]');

        // Toggle state
        button.setAttribute('aria-expanded', !expanded);
        
        if (!expanded) {
            content.style.maxHeight = content.scrollHeight + "px";
            content.classList.remove('opacity-0');
            icon.style.transform = 'rotate(180deg)';
        } else {
            content.style.maxHeight = "0px";
            content.classList.add('opacity-0');
            icon.style.transform = 'rotate(0deg)';
        }
    }

    render() {
        const faqs = this.config.faq || [];
        const { faq: faqLabel } = this.config.labels.nav;

        if (faqs.length === 0) return;

        this.innerHTML = `
            <section id="faq" class="py-24 bg-slate-50 border-t border-slate-200">
                <div class="max-w-4xl mx-auto px-4 sm:px-6">
                    <!-- Title Design reused from IslandSection but adapted -->
                    <div class="text-center mb-16" data-aos="fade-up">
                        <i data-lucide="help-circle" class="w-10 h-10 text-breizh-blue mx-auto mb-4"></i>
                        <h2 class="font-serif text-4xl text-breizh-navy font-bold">${faqLabel || 'Questions Fréquentes'}</h2>
                        <div class="w-20 h-1 bg-accent mx-auto mt-6 rounded-full"></div>
                    </div>

                    <div class="space-y-6 max-w-3xl mx-auto" data-aos="fade-up" data-aos-delay="100">
                        ${faqs.map((item, index) => `
                            <div class="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100 hover:shadow-md transition-shadow duration-300">
                                <button class="w-full px-8 py-6 text-left flex justify-between items-center focus:outline-none hover:bg-slate-50 transition-colors group" aria-expanded="false">
                                    <span class="text-lg text-breizh-navy font-bold group-hover:text-breizh-blue transition-colors">${item.question}</span>
                                    <span class="bg-slate-50 p-2 rounded-full group-hover:bg-breizh-blue/10 transition-colors">
                                        <i data-lucide="chevron-down" class="text-breizh-blue h-5 w-5 transition-transform duration-300"></i>
                                    </span>
                                </button>
                                <div class="transition-all duration-300 ease-in-out max-h-0 opacity-0 overflow-hidden bg-white" style="max-height: 0px;">
                                    <div class="px-8 pb-8 pt-2 text-slate-600 leading-relaxed border-t border-slate-50">
                                        ${item.answer}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
        
        // Re-initialize icons for this section
        if (window.lucide) {
            lucide.createIcons({
                root: this
            });
        }
    }
}

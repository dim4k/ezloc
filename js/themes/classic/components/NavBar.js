import { BaseComponent } from "../../../shared/BaseComponent.js";

export class NavBar extends BaseComponent {
    render() {
        if (!this.config.identity || !this.config.labels) {
            this.style.display = 'none';
            return;
        }

        const { nav } = this.config.labels;
        this.innerHTML = `
            <nav class="fixed w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-20">
                        <div class="flex-shrink-0 flex items-center gap-2 cursor-pointer" data-scroll-top>
                            <i data-lucide="sailboat" class="h-8 w-8 text-breizh-blue"></i>
                            <span class="font-serif text-xl font-bold text-breizh-navy tracking-wide hidden sm:block">${this.config.identity.name}</span>
                            <span class="font-serif text-xl font-bold text-breizh-navy tracking-wide sm:hidden">${this.config.identity.name}</span>
                        </div>
                        <div class="hidden md:flex space-x-8 items-center">
                            <a href="#maison" class="text-slate-600 hover:text-breizh-blue transition-colors uppercase text-xs tracking-widest font-semibold">${nav.home}</a>
                            <a href="#carte" class="text-slate-600 hover:text-breizh-blue transition-colors uppercase text-xs tracking-widest font-semibold">${nav.location}</a>
                            <a href="#faq" class="text-slate-600 hover:text-breizh-blue transition-colors uppercase text-xs tracking-widest font-semibold">${nav.faq || 'FAQ'}</a>
                            <a href="#contact" class="px-6 py-2 btn-primary rounded-full text-sm font-semibold">
                                ${nav.book}
                            </a>
                        </div>
                        <!-- Mobile Menu Button -->
                        <div class="md:hidden">
                            <button class="text-slate-600 p-2" data-menu-toggle aria-label="Menu principal">
                                <i data-lucide="menu"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <!-- Mobile Menu -->
                <div id="mobile-menu" class="hidden md:hidden bg-white border-t p-4 space-y-4 shadow-lg absolute w-full">
                    <a href="#maison" class="block text-slate-700 py-2">${nav.home}</a>
                    <a href="#carte" class="block text-slate-700 py-2">${nav.location}</a>
                    <a href="#faq" class="block text-slate-700 py-2">${nav.faq || 'FAQ'}</a>
                    <a href="#contact" class="block text-breizh-blue font-bold py-2">${nav.book}</a>
                </div>
            </nav>
        `;

        // Listeners rather than inline onclick attributes (blocked by the Content-Security-Policy)
        const menu = this.querySelector("#mobile-menu");
        this.querySelector("[data-scroll-top]").addEventListener("click", () => window.scrollTo(0, 0));
        this.querySelector("[data-menu-toggle]").addEventListener("click", () => menu.classList.toggle("hidden"));
        menu.addEventListener("click", (event) => {
            if (event.target.closest("a")) menu.classList.add("hidden");
        });
    }
}

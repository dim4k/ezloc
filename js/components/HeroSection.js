import { BaseComponent } from "./BaseComponent.js";

export class HeroSection extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    disconnectedCallback() {
        window.removeEventListener('scroll', this.handleScroll.bind(this));
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const heroImage = this.querySelector('.hero-image');
        if (heroImage) {
            heroImage.style.transform = `scale(1.05) translateY(${scrollY * 0.5}px)`;
        }
    }

    render() {
        const { hero } = this.config.labels;
        this.innerHTML = `
            <div class="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
                <!-- Background Image with Overlay -->
                <div class="absolute inset-0 z-0">
                    <img src="${this.config.hero.image}" class="hero-image w-full h-full object-cover object-center scale-105 blur-sm transition-transform duration-75 ease-out" alt="Vue Ile aux moines">
                    <div class="absolute inset-0 bg-gradient-to-b from-breizh-navy/40 to-breizh-navy/70"></div>
                </div>
                
                <!-- Content -->
                <div class="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <h2 class="text-white/90 text-sm md:text-base uppercase tracking-[0.3em] mb-4" data-aos="fade-down" data-aos-delay="100">${this.config.hero.subtitle}</h2>
                    <h1 class="font-serif text-5xl md:text-7xl lg:text-8xl text-white font-bold mb-8 leading-tight" data-aos="fade-up" data-aos-delay="200">
                        ${this.config.hero.title}
                    </h1>
                    <p class="text-slate-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed" data-aos="fade-up" data-aos-delay="300">
                        ${this.config.general.description}
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center" data-aos="fade-up" data-aos-delay="400">
                        <a href="#maison" class="px-8 py-3 bg-white text-breizh-navy rounded-full hover:bg-sand transition-all font-semibold shadow-xl hover:-translate-y-1">
                            ${hero.discover}
                        </a>
                        <a href="#contact" class="px-8 py-3 border-2 border-white text-white rounded-full hover:bg-white/10 transition-all font-semibold hover:-translate-y-1">
                            ${hero.availability}
                        </a>
                    </div>
                </div>

                <!-- Scroll Indicator -->
                <div class="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/70" data-aos="fade-in" data-aos-delay="800">
                    <i data-lucide="chevron-down" class="w-8 h-8"></i>
                </div>
            </div>
        `;
    }
}

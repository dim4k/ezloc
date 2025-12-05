import { BaseComponent } from "./BaseComponent.js";

export class HouseSection extends BaseComponent {
    render() {
        if (!this.config.house_config || !this.config.house_features || this.config.house_features.length === 0) {
            this.style.display = 'none';
            return;
        }

        const { features } = this.config.labels || { features: {} };
        const featuresHtml = this.config.house_features
            .map(
                (feature, index) => `
            <div class="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-slate-100"
                 onclick="document.querySelector('detail-modal').open('${feature.id}')"
                 data-aos="fade-up" data-aos-delay="${index * 50}">
                
                <div class="relative h-64 overflow-hidden">
                    <img src="${feature.thumbnail}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${feature.title}">
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span class="bg-white/90 backdrop-blur text-breizh-navy px-4 py-2 rounded-full text-sm font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            ${features.viewPhotos}
                        </span>
                    </div>
                </div>

                <div class="p-8">
                    <div class="flex items-center gap-3 mb-4 text-breizh-blue">
                        <i data-lucide="${feature.icon}" class="w-6 h-6"></i>
                        <h3 class="font-serif text-2xl text-breizh-navy font-bold">${feature.title}</h3>
                    </div>
                    <p class="text-slate-600 leading-relaxed">
                        ${feature.shortDesc}
                    </p>
                    <div class="mt-6 flex items-center text-accent font-medium text-sm uppercase tracking-wider group-hover:text-breizh-blue transition-colors">
                        ${features.learnMore} <i data-lucide="arrow-right" class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"></i>
                    </div>
                </div>
            </div>
        `
            )
            .join("");

        this.innerHTML = `
            <section id="maison" class="py-24 bg-sand/30">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <span class="text-blue-700 text-sm font-bold uppercase tracking-widest">${
                            this.config.house_config.title
                        }</span>
                        <h2 class="mt-3 text-4xl font-serif text-breizh-navy font-bold">${
                            this.config.house_config.subtitle
                        }</h2>
                        <div class="w-20 h-1 bg-accent mx-auto mt-6 rounded-full"></div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        ${featuresHtml}
                    </div>

                    <!-- Amenities Bar -->
                    <div class="mt-20 bg-white rounded-xl p-8 shadow-lg border border-slate-100 flex flex-wrap justify-center gap-6 md:gap-12 items-center">
                        ${this.config.house_config.amenities
                            .map(
                                (item) => `
                            <div class="flex items-center gap-2 text-slate-600 font-medium">
                                <i data-lucide="check-circle" class="text-green-500 w-5 h-5"></i> ${item}
                            </div>
                        `
                            )
                            .join("")}
                    </div>
                </div>
            </section>
        `;
    }
}

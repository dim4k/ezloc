import { BaseComponent } from "./BaseComponent.js";

export class ActivitiesSection extends BaseComponent {
    constructor() {
        super();
        this.currentImageIndex = {};
    }

    changeImage(activity, direction) {
        const activity_obj = this.config.activities.find(
            (a) => a.title === activity
        );
        if (!activity_obj) return;

        const key = `activity-${activity}`;
        this.currentImageIndex[key] = this.currentImageIndex[key] || 0;

        const maxIndex = activity_obj.images.length - 1;
        this.currentImageIndex[key] += direction;

        if (this.currentImageIndex[key] < 0)
            this.currentImageIndex[key] = maxIndex;
        if (this.currentImageIndex[key] > maxIndex)
            this.currentImageIndex[key] = 0;

        this.updateActivityGallery(activity);
    }

    updateActivityGallery(activity) {
        const activity_obj = this.config.activities.find(
            (a) => a.title === activity
        );
        const key = `activity-${activity}`;
        const index = this.currentImageIndex[key] || 0;

        const imageContainer = this.querySelector(
            `[data-activity-gallery="${activity}"]`
        );
        if (!imageContainer) return;

        const currentImage = activity_obj.images[index];
        imageContainer.style.backgroundImage = `url('${currentImage}')`;

        // Update counter
        const counter = this.querySelector(`[data-counter="${activity}"]`);
        if (counter)
            counter.textContent = `${index + 1}/${activity_obj.images.length}`;
    }

    render() {
        if (!this.config.activities_config || !this.config.activities || this.config.activities.length === 0) {
            this.style.display = 'none';
            return;
        }

        const { activities_config } = this.config;

        const activitiesHtml = this.config.activities
            .map((activity, index) => {
                const imageCount = activity.images?.length || 0;
                const firstImage = activity.images?.[0] || "./img/facade.jpg";

                return `
            <div class="h-full" data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full flex flex-col items-center text-center border border-slate-100 group hover:-translate-y-1">
                    <div class="rounded-full overflow-hidden flex-shrink-0 mb-6 shadow-md border-4 border-slate-50 bg-slate-100 group-hover:border-breizh-blue/20 transition-colors duration-300" style="width: 120px; height: 120px;">
                        <img src="${firstImage}" alt="${activity.title}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" loading="lazy">
                    </div>
                    <h3 class="font-bold text-xl text-breizh-navy mb-3 font-serif group-hover:text-breizh-blue transition-colors">${activity.title}</h3>
                    <p class="text-slate-600 text-sm leading-relaxed">${activity.description}</p>
                </div>
            </div>
        `;
            })
            .join("");

        this.innerHTML = `
            <section id="ile" class="py-24 bg-gradient-to-br from-blue-50 to-slate-50 border-t-2 border-accent">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <i data-lucide="compass" class="w-10 h-10 text-breizh-blue mx-auto mb-4"></i>
                        <h2 class="text-4xl font-serif text-breizh-navy font-bold">${activities_config.title}</h2>
                        <p class="mt-4 text-slate-600 text-lg">${activities_config.subtitle}</p>
                        <div class="w-20 h-1 bg-accent mx-auto mt-6 rounded-full"></div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        ${activitiesHtml}
                    </div>
                </div>
            </section>
        `;
    }
}

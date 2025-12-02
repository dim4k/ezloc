import { BaseComponent } from "./BaseComponent.js";

export class IslandSection extends BaseComponent {
    constructor() {
        super();
        this.currentImageIndex = {};
    }

    changeImage(activity, direction) {
        const activity_obj = this.config.island.activities.find(
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
        const activity_obj = this.config.island.activities.find(
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
        const { island } = this.config;

        const activitiesHtml = island.activities
            .map((activity) => {
                const imageCount = activity.images?.length || 0;
                const firstImage = activity.images?.[0] || "./img/facade.jpg";

                return `
            <div class="flex flex-col h-full">
                <!-- Content -->
                <div class="flex flex-col items-center text-center flex-1">
                    <div class="w-40 h-40 rounded-full overflow-hidden flex items-center justify-center mb-4 shadow-lg border-4 border-slate-200" style="background-image: url('${firstImage}'); background-size: cover; background-position: center;"></div>
                    <h3 class="font-bold text-breizh-navy mb-2">${activity.title}</h3>
                    <p class="text-slate-600 text-sm">${activity.description}</p>
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
                        <h2 class="text-4xl font-serif text-breizh-navy font-bold">${island.title}</h2>
                        <p class="mt-4 text-slate-600 text-lg">${island.subtitle}</p>
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

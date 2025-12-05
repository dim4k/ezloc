import { BaseComponent } from "./BaseComponent.js";

export class DetailModal extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        this.render();
        this.dialog = this.querySelector("dialog");
        this.currentImageIndex = 0;
    }

    open(featureId) {
        const feature = this.config.house_features.find((f) => f.id === featureId);
        if (!feature) return;

        this.currentFeature = feature;
        this.currentImageIndex = 0;
        this.updateModal();
        if (window.lucide) lucide.createIcons();
        this.dialog.showModal();
    }

    updateModal() {
        const feature = this.currentFeature;
        const contentDiv = this.querySelector("#modal-content");
        const currentImg = feature.gallery[this.currentImageIndex];
        const totalImages = feature.gallery.length;
        const hasMultiple = totalImages > 1;
        const { modal } = this.config.labels;

        contentDiv.innerHTML = `
            <div class="flex flex-col h-full">
                <!-- Image Slider - Full width top -->
                <div class="flex-1 bg-slate-900 relative flex items-center justify-center overflow-hidden min-h-[300px]">
                    <img src="${currentImg}" class="max-w-full max-h-full object-contain" alt="${
            feature.title
        }">
                    
                    <!-- Image Counter -->
                    <div class="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        ${this.currentImageIndex + 1} / ${totalImages}
                    </div>
                    
                    <!-- Navigation Arrows -->
                    ${
                        hasMultiple
                            ? `
                        <button class="modal-prev absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-breizh-navy p-2 rounded-full transition-all shadow-lg">
                            <i data-lucide="chevron-left" class="w-6 h-6"></i>
                        </button>
                        <button class="modal-next absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-breizh-navy p-2 rounded-full transition-all shadow-lg">
                            <i data-lucide="chevron-right" class="w-6 h-6"></i>
                        </button>
                    `
                            : ""
                    }
                </div>
                
                <!-- Content - Bottom scrollable section -->
                <div class="flex-1 overflow-y-auto bg-white border-t border-slate-100">
                    <div class="p-8 max-w-2xl">
                        <div class="flex items-center gap-3 mb-6 text-breizh-blue">
                            <i data-lucide="${
                                feature.icon
                            }" class="w-8 h-8"></i>
                            <span class="uppercase tracking-widest text-sm font-bold">${
                                modal.details
                            }</span>
                        </div>
                        <h2 class="font-serif text-3xl text-breizh-navy font-bold mb-6">${
                            feature.title
                        }</h2>
                        <p class="text-slate-600 text-base leading-relaxed mb-8">
                            ${feature.fullDesc}
                        </p>
                        
                        <!-- Image Thumbnails for multiple images -->
                        ${
                            hasMultiple
                                ? `
                            <div class="mb-8 pb-8 border-b border-slate-200">
                                <h4 class="font-bold text-breizh-navy mb-3 text-sm">${
                                    modal.otherPhotos
                                }</h4>
                                <div class="flex gap-2 overflow-x-auto pb-2 scroll-smooth">
                                    ${feature.gallery
                                        .map(
                                            (img, idx) => `
                                        <img src="${img}" alt="Photo ${
                                                idx + 1
                                            }" 
                                             class="h-24 w-24 flex-shrink-0 object-cover rounded cursor-pointer transition-all border-2 ${
                                                 idx === this.currentImageIndex
                                                     ? "border-breizh-blue shadow-md"
                                                     : "border-slate-200 opacity-60 hover:opacity-100"
                                             }"
                                             onclick="document.querySelector('detail-modal').setImage(${idx})">
                                    `
                                        )
                                        .join("")}
                                </div>
                            </div>
                        `
                                : ""
                        }
                        
                        <button onclick="this.closest('dialog').close()" class="inline-flex items-center gap-2 px-6 py-2 border border-slate-300 rounded-full hover:bg-slate-50 transition-colors text-sm font-medium">
                            <i data-lucide="x" class="w-4 h-4"></i> ${
                                modal.close
                            }
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Attach event listeners
        const prevBtn = contentDiv.querySelector(".modal-prev");
        const nextBtn = contentDiv.querySelector(".modal-next");

        if (prevBtn) {
            prevBtn.addEventListener("click", () => this.previousImage());
        }
        if (nextBtn) {
            nextBtn.addEventListener("click", () => this.nextImage());
        }

        if (window.lucide) lucide.createIcons();
    }

    previousImage() {
        if (!this.currentFeature) return;
        this.currentImageIndex =
            (this.currentImageIndex - 1 + this.currentFeature.gallery.length) %
            this.currentFeature.gallery.length;
        this.updateModal();
    }

    nextImage() {
        if (!this.currentFeature) return;
        this.currentImageIndex =
            (this.currentImageIndex + 1) % this.currentFeature.gallery.length;
        this.updateModal();
    }

    setImage(index) {
        this.currentImageIndex = index;
        this.updateModal();
    }

    render() {
        this.innerHTML = `
            <dialog class="backdrop:bg-breizh-navy/80 w-full max-w-6xl h-[90vh] max-h-[90vh] rounded-2xl shadow-2xl p-0 overflow-hidden m-auto bg-transparent animate-[fadeInUp_0.3s_ease-out]">
                <div class="relative h-full w-full bg-white relative" id="modal-content">
                    <!-- JS Injected Content Here -->
                </div>
                <button onclick="this.closest('dialog').close()" class="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white p-2 rounded-full transition-all shadow-lg">
                    <i data-lucide="x" class="w-6 h-6 text-breizh-navy"></i>
                </button>
            </dialog>
        `;
    }
}

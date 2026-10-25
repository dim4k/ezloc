import { BaseComponent } from "../../../shared/BaseComponent.js";
import { sectionHeader } from "../helpers.js";

export class PavMap extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        // Initialize map after component is mounted to DOM
        setTimeout(() => this.initMap(), 100);
    }

    initMap() {
        const mapEl = this.querySelector("#pav-leaflet");
        if (!mapEl || this.map || typeof L === "undefined") return;

        const { lat, lng, mapZoom } = this.config.location;

        this.map = L.map(mapEl, {
            scrollWheelZoom: false,
            dragging: !L.Browser.mobile,
            tap: false,
            fadeAnimation: false, // Fix for tile rendering artifacts
            zoomAnimation: false, // Fix for tile rendering artifacts
        }).setView([lat, lng], mapZoom || 13);

        // On desktop the info card covers the left of the map: shift the house to the right
        if (window.matchMedia("(min-width: 768px)").matches) {
            this.map.panBy([-220, 0], { animate: false });
        }

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(this.map);

        const pin = L.divIcon({
            className: "pav-marker",
            html: '<span class="pav-pulse"></span><span class="pav-pin"></span>',
            iconSize: [44, 44],
            iconAnchor: [22, 50],
        });
        L.marker([lat, lng], { icon: pin, keyboard: false }).addTo(this.map);
    }

    render() {
        const { location, labels } = this.config;
        if (!location || !labels) {
            this.style.display = "none";
            return;
        }

        const { map } = labels;
        const directions = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;

        // Mobile: header, map, then details. Desktop: full-width map with a floating card.
        this.innerHTML = `
            <section id="situation" class="relative flex flex-col bg-white px-5 py-20 md:block md:min-h-[640px] md:bg-[#CFDCE3] md:p-0">
                <div class="contents md:pointer-events-none md:relative md:z-10 md:mx-auto md:block md:max-w-[1360px] md:px-10 md:py-20">
                    <div class="contents md:pointer-events-auto md:block md:max-w-[460px] md:rounded-2xl md:bg-white md:p-10 md:shadow-[0_24px_60px_-24px_rgba(12,24,35,.45)]">
                        <div class="order-1">
                            ${sectionHeader({ num: "04", eyebrow: map.title, title: map.subtitle })}
                        </div>
                        <div class="order-3 mt-6 md:mt-0">
                            <p class="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-pav-muted">${map.addressTitle || "Adresse"}</p>
                            <p class="mb-6 text-[17px] font-medium leading-normal">${location.address || ""}</p>
                            ${map.nearbyList?.length ? `
                                <p class="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-pav-muted">${map.nearbyTitle || ""}</p>
                                <ul class="mb-7 flex flex-col gap-3.5 text-[15px] text-pav-ink">
                                    ${map.nearbyList.map((item) => `
                                        <li class="flex items-center gap-3"><i data-lucide="map-pin" class="h-[18px] w-[18px] shrink-0 text-pav-blue"></i>${item}</li>
                                    `).join("")}
                                </ul>
                            ` : ""}
                            <a href="${directions}" target="_blank" rel="noopener" class="flex min-h-[52px] items-center justify-center gap-2 rounded-lg border-[1.5px] border-pav-navy font-semibold transition-colors hover:bg-pav-navy hover:text-white">
                                Ouvrir l'itinéraire <i data-lucide="arrow-up-right" class="h-4 w-4"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="order-2 h-[240px] overflow-hidden rounded-2xl md:absolute md:inset-0 md:z-0 md:h-auto md:rounded-none">
                    <div id="pav-leaflet" class="h-full w-full" role="region" aria-label="Carte : ${map.subtitle || map.title || ""}"></div>
                </div>
            </section>
        `;
    }
}

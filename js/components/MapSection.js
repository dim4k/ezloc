import { BaseComponent } from "./BaseComponent.js";

export class MapSection extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        // Initialize map after component is mounted to DOM
        setTimeout(() => this.initMap(), 100);
    }

    initMap() {
        const mapEl = this.querySelector("#leaflet-map");
        if (!mapEl || this.mapInitialized) return;

        const { lat, lng, mapZoom } = this.config.location;

        // Check if L is defined (Leaflet)
        if (typeof L === "undefined") return;

        const map = L.map(mapEl, {
            scrollWheelZoom: false,
            dragging: !L.Browser.mobile,
            tap: false,
            fadeAnimation: false, // Fix for tile rendering artifacts
            zoomAnimation: false  // Fix for tile rendering artifacts
        }).setView([lat, lng], mapZoom);

        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
            {
                detectRetina: true,
                maxZoom: 19
            }
        ).addTo(map);

        // Custom Icon
        // Custom Icon using DivIcon for better styling
        const houseIcon = L.divIcon({
            className: 'custom-map-marker',
            html: `
                <div class="w-12 h-12 bg-breizh-blue rounded-full border-4 border-white shadow-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white w-6 h-6">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                </div>
                <div class="w-4 h-4 bg-breizh-blue rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r-4 border-b-4 border-white"></div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 54], // Center bottom (48/2, 48 + arrow height)
            popupAnchor: [0, -50],
        });

        L.marker([lat, lng], { icon: houseIcon }).addTo(map);

        this.mapInitialized = true;
    }

    render() {
        const { map } = this.config.labels;
        this.innerHTML = `
            <section id="carte" class="py-0 flex flex-col md:flex-row h-auto md:h-[600px]">
                <div class="w-full md:w-1/5 bg-breizh-navy text-white p-12 flex flex-col justify-center z-10 text-center md:text-left">
                    <div class="mb-8">
                        <i data-lucide="map-pin" class="w-10 h-10 text-accent mb-4 mx-auto md:mx-0"></i>
                        <h2 class="text-3xl font-serif font-bold mb-2">${
                            map.title
                        }</h2>
                        <p class="text-slate-300">${map.subtitle}</p>
                    </div>
                    
                    <div class="space-y-6 inline-block md:block">
                        <div>
                            <h4 class="font-bold text-accent text-sm uppercase tracking-wider mb-1">${
                                map.addressTitle
                            }</h4>
                            <p class="text-lg opacity-90">${
                                this.config.location.address
                            }</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-accent text-sm uppercase tracking-wider mb-1">${
                                map.nearbyTitle
                            }</h4>
                            <ul class="text-slate-300 space-y-1">
                                ${map.nearbyList
                                    .map((item) => `<li>• ${item}</li>`)
                                    .join("")}
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="w-full md:w-4/5 h-[400px] md:h-full relative z-0">
                    <div id="leaflet-map" class="w-full h-full z-0"></div>
                </div>
            </section>
        `;
    }
}

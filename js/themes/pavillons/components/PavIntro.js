import { BaseComponent } from "../../../shared/BaseComponent.js";
import { amenityIcon } from "../helpers.js";

export class PavIntro extends BaseComponent {
    render() {
        const { identity, house_config } = this.config;
        if (!identity) {
            this.style.display = "none";
            return;
        }

        const amenities = house_config?.amenities || [];

        this.innerHTML = `
            <section class="bg-pav-chalk">
                <div class="mx-auto max-w-[1360px] px-5 py-[72px] md:px-10 md:py-28">
                    <p class="pav-reveal max-w-[1040px] text-[19px] leading-[1.65] text-pav-ink md:font-display md:text-[34px] md:leading-[1.3] md:tracking-[-0.01em] md:text-pav-navy">
                        ${identity.description || ""}
                    </p>
                    ${amenities.length ? `
                        <div class="pav-reveal mt-10 rounded-2xl bg-white p-6 md:mt-14 md:rounded-none md:border-t-2 md:border-pav-navy md:bg-transparent md:p-0">
                            <p class="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-pav-muted md:hidden">En bref</p>
                            <ul class="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3 md:gap-y-0 lg:grid-cols-6">
                                ${amenities.map((item) => `
                                    <li class="flex items-center gap-2.5 text-[15px] leading-snug md:flex-col md:items-start md:gap-2 md:pr-4 md:pt-6 md:text-base">
                                        <i data-lucide="${amenityIcon(item)}" class="h-[22px] w-[22px] shrink-0 text-pav-blue md:h-7 md:w-7"></i>
                                        <span>${item}</span>
                                    </li>
                                `).join("")}
                            </ul>
                        </div>
                    ` : ""}
                </div>
            </section>
        `;
    }
}

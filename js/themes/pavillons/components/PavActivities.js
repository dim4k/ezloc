import { BaseComponent } from "../../../shared/BaseComponent.js";
import { sectionHeader } from "../helpers.js";

export class PavActivities extends BaseComponent {
    render() {
        const { activities_config: config, activities } = this.config;
        if (!config || !activities || activities.length === 0) {
            this.style.display = "none";
            return;
        }

        this.innerHTML = `
            <section id="ile" class="bg-pav-navy py-20 text-white md:py-32">
                <div class="mx-auto max-w-[1360px] md:px-10">
                    <div class="px-5 md:px-0">
                        ${sectionHeader({ num: "02", eyebrow: config.subtitle, title: config.title, dark: true })}
                    </div>
                    <div class="pav-noscrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 md:grid md:grid-cols-2 md:gap-x-12 md:gap-y-16 md:overflow-visible md:px-0">
                        ${activities.map((activity, i) => `
                            <article class="w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl bg-pav-navy-2 md:w-auto md:rounded-none md:bg-transparent ${i % 2 ? "md:mt-24" : ""}">
                                ${activity.images?.[0] ? `
                                    <div class="overflow-hidden md:rounded">
                                        <img src="${activity.images[0]}" alt="" loading="lazy" decoding="async" class="pav-unveil aspect-[3/2] w-full object-cover md:aspect-video">
                                    </div>
                                ` : ""}
                                <div class="pav-reveal p-5 pb-6 md:flex md:items-baseline md:gap-5 md:px-0 md:pt-6">
                                    <span class="text-xs font-semibold tracking-[0.12em] text-pav-yellow md:font-display md:text-[56px] md:font-normal md:leading-none md:tracking-normal">${String(i + 1).padStart(2, "0")}</span>
                                    <div>
                                        <h3 class="mt-2 text-[19px] font-semibold leading-snug md:mt-0 md:text-2xl">${activity.title}</h3>
                                        <div class="pav-rich mt-2.5 text-[15px] leading-relaxed text-pav-muted-dark md:text-base">${activity.description || ""}</div>
                                    </div>
                                </div>
                            </article>
                        `).join("")}
                    </div>
                </div>
            </section>
        `;
    }
}

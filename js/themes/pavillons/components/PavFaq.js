import { BaseComponent } from "../../../shared/BaseComponent.js";
import { sectionHeader } from "../helpers.js";

export class PavFaq extends BaseComponent {
    render() {
        const faqs = this.config.faq || [];
        if (faqs.length === 0 || !this.config.labels) {
            this.style.display = "none";
            return;
        }

        const { nav, faq: faqLabels = {} } = this.config.labels;

        this.innerHTML = `
            <section id="faq" class="bg-pav-chalk py-20 md:py-32">
                <div class="mx-auto max-w-[1360px] px-5 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:items-start md:gap-16 md:px-10">
                    ${sectionHeader({ num: "06", eyebrow: nav.faq || "FAQ", title: faqLabels.title || "Questions fréquentes" })}
                    <div class="pav-reveal rounded-2xl bg-white px-5 md:px-8">
                        ${faqs.map((item, i) => `
                            <div class="pav-faq-item${i === 0 ? " is-open" : " border-t border-pav-sand"}">
                                <h3>
                                    <button type="button" id="pav-faq-q-${i}" aria-expanded="${i === 0}" aria-controls="pav-faq-a-${i}"
                                            class="flex w-full items-center justify-between gap-4 py-5 text-left text-base font-semibold leading-snug md:py-6 md:text-lg">
                                        ${item.question}
                                        <i data-lucide="chevron-down" class="pav-chevron h-5 w-5 shrink-0 text-pav-blue"></i>
                                    </button>
                                </h3>
                                <div id="pav-faq-a-${i}" role="region" aria-labelledby="pav-faq-q-${i}" class="pav-collapse" ${i === 0 ? "" : "inert"}>
                                    <div>
                                        <div class="pav-rich pb-5 text-[15px] leading-relaxed text-pav-ink md:pb-6 md:text-base">${item.answer}</div>
                                    </div>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </section>
        `;

        this.querySelectorAll(".pav-faq-item button").forEach((button) => {
            button.addEventListener("click", () => {
                const item = button.closest(".pav-faq-item");
                const open = !item.classList.contains("is-open");
                item.classList.toggle("is-open", open);
                button.setAttribute("aria-expanded", String(open));
                item.querySelector(".pav-collapse").inert = !open;
            });
        });
    }
}

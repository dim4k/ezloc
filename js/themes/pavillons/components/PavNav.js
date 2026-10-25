import { BaseComponent } from "../../../shared/BaseComponent.js";

export class PavNav extends BaseComponent {
    connectedCallback() {
        super.connectedCallback();
        this.onScroll = () => this.header?.classList.toggle("is-solid", window.scrollY > 80);
        this.onKeydown = (e) => {
            if (e.key === "Escape") this.setMenu(false);
        };
        window.addEventListener("scroll", this.onScroll, { passive: true });
        this.onScroll();
    }

    disconnectedCallback() {
        window.removeEventListener("scroll", this.onScroll);
        document.removeEventListener("keydown", this.onKeydown);
    }

    setMenu(open) {
        if (!this.menu) return;
        this.menu.classList.toggle("is-open", open);
        this.menuButton.setAttribute("aria-expanded", String(open));
        document.documentElement.style.overflow = open ? "hidden" : "";
        if (open) {
            document.addEventListener("keydown", this.onKeydown);
            this.menu.querySelector("[data-menu-close]").focus();
        } else {
            document.removeEventListener("keydown", this.onKeydown);
        }
    }

    render() {
        if (!this.config.identity || !this.config.labels) {
            this.style.display = "none";
            return;
        }

        const { nav } = this.config.labels;
        const { name } = this.config.identity;
        const phone = this.config.contact?.phone;
        const links = [
            ["#maison", nav.home],
            ["#tarifs", nav.pricing],
            ["#situation", nav.location],
            ["#faq", nav.faq || "FAQ"],
        ].filter(([, label]) => label);

        this.innerHTML = `
            <header class="pav-header fixed inset-x-0 top-0 z-40 text-white">
                <div class="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-6 px-5 md:h-20 md:px-10">
                    <a href="#top" class="font-display text-xl md:text-2xl">${name}</a>
                    <nav class="hidden items-center gap-8 text-[15px] font-medium md:flex" aria-label="Navigation principale">
                        ${links.map(([href, label]) => `<a href="${href}" class="transition-colors hover:text-pav-yellow">${label}</a>`).join("")}
                    </nav>
                    <a href="#reserver" class="pav-btn hidden md:inline-flex">${nav.book}</a>
                    <button type="button" data-menu-open class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-pav-navy/45 md:hidden" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="pav-menu">
                        <i data-lucide="menu" class="h-6 w-6"></i>
                    </button>
                </div>
            </header>

            <div id="pav-menu" class="pav-menu fixed inset-0 z-50 flex-col bg-pav-navy px-5 pb-8 pt-2 text-white md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
                <div class="flex h-16 items-center justify-between">
                    <span class="font-display text-xl">${name}</span>
                    <button type="button" data-menu-close class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-pav-navy-2" aria-label="Fermer le menu">
                        <i data-lucide="x" class="h-6 w-6"></i>
                    </button>
                </div>
                <nav class="mt-12 flex flex-col gap-1" aria-label="Navigation mobile">
                    ${links.map(([href, label], i) => `<a href="${href}" class="pav-menu-link py-2.5 font-display text-[40px] leading-tight" style="--d:${0.08 * (i + 1)}s">${label}</a>`).join("")}
                </nav>
                <div class="mt-auto flex flex-col gap-3">
                    <a href="#reserver" class="pav-btn min-h-14 text-base">${nav.book}</a>
                    ${phone ? `<a href="tel:${phone.replace(/\s/g, "")}" class="py-3 text-center font-semibold text-pav-yellow">${phone}</a>` : ""}
                </div>
            </div>
        `;

        this.header = this.querySelector(".pav-header");
        this.menu = this.querySelector("#pav-menu");
        this.menuButton = this.querySelector("[data-menu-open]");
        this.menuButton.addEventListener("click", () => this.setMenu(true));
        this.menu.querySelectorAll("[data-menu-close], a").forEach((el) => {
            el.addEventListener("click", () => this.setMenu(false));
        });
    }
}

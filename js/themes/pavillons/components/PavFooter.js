import { BaseComponent } from "../../../shared/BaseComponent.js";

export class PavFooter extends BaseComponent {
    render() {
        if (!this.config.identity || !this.config.labels) {
            this.style.display = "none";
            return;
        }

        const year = new Date().getFullYear();
        const { footer } = this.config.labels;

        // Extra bottom padding on mobile so the booking bar never hides the footer
        this.innerHTML = `
            <footer class="border-t border-white/10 bg-pav-navy text-pav-muted-dark">
                <div class="mx-auto flex max-w-[1360px] flex-col gap-2 px-5 pb-28 pt-8 text-[13px] leading-relaxed md:flex-row md:justify-between md:px-10 md:pb-10 md:text-sm">
                    <span>${this.config.identity.name} · ${footer.location}</span>
                    <span>&copy; ${year} ${footer.rights} ${footer.credits} <a href="https://antoine.kim" target="_blank" rel="noopener" class="text-white underline transition-colors hover:text-pav-yellow">Antoine Kim</a></span>
                </div>
            </footer>
        `;
    }
}

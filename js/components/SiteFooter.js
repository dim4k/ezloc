import { BaseComponent } from "./BaseComponent.js";

export class SiteFooter extends BaseComponent {
    render() {
        const year = new Date().getFullYear();
        const { footer } = this.config.labels;
        this.innerHTML = `
            <footer class="bg-breizh-navy text-white py-12 border-t border-slate-700">
                <div class="max-w-7xl mx-auto px-4">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h3 class="font-serif text-2xl font-bold mb-2">${this.config.general.name}</h3>
                            <p class="text-slate-400 text-sm">${footer.location}</p>
                        </div>
                        
                        <div class="text-center md:text-right text-slate-300 text-sm">
                            &copy; ${year} ${footer.rights} | ${footer.credits} <a href="https://antoine.kim" target="_blank" class="text-slate-300 hover:text-white transition-colors underline">Antoine Kim</a>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }
}

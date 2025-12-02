import { SITE_CONFIG } from "../config.js";

/**
 * BASE COMPONENT CLASS
 * A small utility class to simplify our Web Components
 */
export class BaseComponent extends HTMLElement {
    constructor() {
        super();
        this.config = SITE_CONFIG;
    }

    connectedCallback() {
        this.render();
        // Re-initialize Lucide icons after rendering
        if (window.lucide) lucide.createIcons();
    }

    render() {
        // To be implemented by child
    }
}

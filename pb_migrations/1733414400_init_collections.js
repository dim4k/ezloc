/// <reference path="../pb_data/types.d.ts" />

/**
 * Initial collections (PocketBase 0.23+ API).
 * Databases created with PocketBase 0.22 already recorded this migration and are converted
 * by PocketBase itself on first start, so this only runs on fresh installs.
 */

migrate((app) => {
    const IMAGES = ["image/jpeg", "image/png", "image/webp"];

    // The front sorts singletons by "-created": every collection keeps the 0.22 system dates
    const DATES = [
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ];

    const collections = [
        // 1. Site Identity (Singleton)
        {
            name: "site_identity",
            listRule: "",
            viewRule: "",
            fields: [
                { name: "name", type: "text", required: true },
                { name: "tagline", type: "text" },
                { name: "description", type: "text" },
                { name: "favicon", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/png", "image/x-icon", "image/svg+xml"] },
                { name: "labels", type: "json", maxSize: 5242880 },
            ],
        },
        // 2. Welcome Section (Singleton)
        {
            name: "welcome",
            listRule: "",
            viewRule: "",
            fields: [
                { name: "title", type: "text" },
                { name: "subtitle", type: "text" },
                { name: "image", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: IMAGES },
                { name: "display_options", type: "json", maxSize: 5242880 },
            ],
        },
        // 3. House Config (Singleton)
        {
            name: "house_config",
            listRule: "",
            viewRule: "",
            fields: [
                { name: "title", type: "text" },
                { name: "subtitle", type: "text" },
                { name: "amenities", type: "json", maxSize: 5242880 },
            ],
        },
        // 4. House Features (List)
        {
            name: "house_features",
            listRule: "",
            viewRule: "",
            fields: [
                { name: "title", type: "text", required: true },
                { name: "shortDesc", type: "text" },
                { name: "fullDesc", type: "editor" },
                { name: "icon", type: "text" },
                { name: "thumbnail", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: IMAGES },
                { name: "gallery", type: "file", maxSelect: 20, maxSize: 5242880, mimeTypes: IMAGES },
                { name: "order", type: "number", onlyInt: true },
            ],
        },
        // 5. Activities Config (Singleton)
        {
            name: "activities_config",
            listRule: "",
            viewRule: "",
            fields: [
                { name: "title", type: "text" },
                { name: "subtitle", type: "text" },
            ],
        },
        // 6. Activities (List)
        {
            name: "activities",
            listRule: "",
            viewRule: "",
            fields: [
                { name: "title", type: "text", required: true },
                { name: "description", type: "editor" },
                { name: "images", type: "file", maxSelect: 10, maxSize: 5242880, mimeTypes: IMAGES },
                { name: "order", type: "number", onlyInt: true },
            ],
        },
        // 7. Contact (Singleton)
        {
            name: "contact",
            listRule: "",
            viewRule: "",
            fields: [
                { name: "email", type: "email" },
                { name: "phone", type: "text" },
                { name: "name", type: "text" },
                { name: "airbnbUrl", type: "url" },
            ],
        },
        // 8. Location (Singleton)
        {
            name: "location",
            listRule: "",
            viewRule: "",
            fields: [
                { name: "lat", type: "number" },
                { name: "lng", type: "number" },
                { name: "address", type: "text" },
                { name: "zoom", type: "number" },
            ],
        },
        // 9. Pricing Config (Singleton)
        {
            name: "pricing_config",
            listRule: "",
            viewRule: "",
            fields: [
                { name: "cleaningFee", type: "number" },
                { name: "defaultPrice", type: "number" },
                { name: "details", type: "json", maxSize: 5242880 },
            ],
        },
        // 10. Pricing Periods (List)
        {
            name: "pricing_periods",
            listRule: "",
            viewRule: "",
            fields: [
                { name: "start", type: "text", required: true },
                { name: "end", type: "text", required: true },
                { name: "price", type: "number", required: true },
            ],
        },
        // 11. FAQ (List)
        {
            name: "faq",
            listRule: "",
            viewRule: "",
            fields: [
                { name: "question", type: "text", required: true },
                { name: "answer", type: "editor", required: true },
                { name: "order", type: "number", onlyInt: true },
            ],
        },
        // 12. Messages (List): anyone can create, only superusers can read
        {
            name: "messages",
            createRule: "",
            fields: [
                { name: "name", type: "text", required: true },
                { name: "email", type: "email", required: true },
                { name: "arrival", type: "text" },
                { name: "departure", type: "text" },
                { name: "message", type: "text", required: true },
                { name: "price_estimation", type: "text" },
            ],
        },
    ];

    collections.forEach((config) => {
        try {
            app.findCollectionByNameOrId(config.name);
            return; // already there
        } catch (e) {
            // not created yet
        }
        app.save(new Collection(Object.assign({ type: "base" }, config, { fields: config.fields.concat(DATES) })));
    });
}, (app) => {
    // down migration - typically we don't delete data in 'down' for initial schema
});

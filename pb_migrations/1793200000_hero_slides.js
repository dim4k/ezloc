/// <reference path="../pb_data/types.d.ts" />

/**
 * Photos of the mobile hero (full-screen stories), each with an optional caption.
 * The desktop hero keeps using welcome.image.
 * Additive only: without slides, the mobile hero falls back to welcome.image.
 */

migrate((app) => {
    try {
        app.findCollectionByNameOrId("hero_slides");
        return;
    } catch (e) {
        // not created yet
    }

    app.save(new Collection({
        type: "base",
        name: "hero_slides",
        listRule: "",
        viewRule: "",
        fields: [
            // Shown full screen on phones: upload large photos (2000 px wide or more)
            { name: "image", type: "file", required: true, maxSelect: 1, maxSize: 15728640, mimeTypes: ["image/jpeg", "image/png", "image/webp"], thumbs: [] },
            { name: "caption", type: "text" },
            { name: "order", type: "number", onlyInt: true },
            { name: "created", type: "autodate", onCreate: true, onUpdate: false },
            { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
    }));
}, (app) => {
    try {
        app.delete(app.findCollectionByNameOrId("hero_slides"));
    } catch (e) {
        // already removed
    }
});

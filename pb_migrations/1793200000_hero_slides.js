/// <reference path="../pb_data/types.d.ts" />

/**
 * Photos of the mobile hero (full-screen stories), each with an optional caption.
 * The desktop hero keeps using welcome.image.
 * Additive only: without slides, the mobile hero falls back to welcome.image.
 */

migrate((db) => {
    const dao = new Dao(db);

    try {
        dao.findCollectionByNameOrId("hero_slides");
        return;
    } catch (e) {
        // not created yet
    }

    dao.saveCollection(new Collection({
        name: "hero_slides",
        type: "base",
        system: false,
        listRule: "",
        viewRule: "",
        schema: [
            // Shown full screen on phones: upload large photos (2000 px wide or more)
            { name: "image", type: "file", required: true, options: { maxSelect: 1, maxSize: 15728640, mimeTypes: ["image/jpeg", "image/png", "image/webp"], thumbs: [] } },
            { name: "caption", type: "text", required: false },
            { name: "order", type: "number", required: false, options: { min: null, max: null, noDecimal: true } },
        ],
    }));
}, (db) => {
    const dao = new Dao(db);

    try {
        dao.deleteCollection(dao.findCollectionByNameOrId("hero_slides"));
    } catch (e) {
        // already removed
    }
});

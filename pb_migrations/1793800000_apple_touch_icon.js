/// <reference path="../pb_data/types.d.ts" />

/**
 * site_identity.apple_touch_icon: the home screen icon of iPhones and iPads (a square PNG, 180x180,
 * without transparency: iOS rounds the corners itself). Declared in the head and served at /apple-touch-icon.png.
 * Additive only: without it, iOS keeps using a screenshot of the page.
 */

migrate((app) => {
    let collection;
    try {
        collection = app.findCollectionByNameOrId("site_identity");
    } catch (e) {
        return;
    }
    if (collection.fields.getByName("apple_touch_icon")) return;
    collection.fields.add(new Field({ name: "apple_touch_icon", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/png"] }));
    app.save(collection);
}, (app) => {
    let collection;
    try {
        collection = app.findCollectionByNameOrId("site_identity");
    } catch (e) {
        return;
    }
    if (!collection.fields.getByName("apple_touch_icon")) return;
    collection.fields.removeByName("apple_touch_icon");
    app.save(collection);
});

/// <reference path="../pb_data/types.d.ts" />

/**
 * Optional phone number on booking requests.
 * Additive only: older front-ends simply never send it.
 */

migrate((app) => {
    let collection;
    try {
        collection = app.findCollectionByNameOrId("messages");
    } catch (e) {
        return;
    }
    if (collection.fields.getByName("phone")) return;

    collection.fields.add(new TextField({ name: "phone", required: false, max: 40 }));
    app.save(collection);
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("messages");
        if (collection.fields.getByName("phone")) {
            collection.fields.removeByName("phone");
            app.save(collection);
        }
    } catch (e) {
        // already removed
    }
});

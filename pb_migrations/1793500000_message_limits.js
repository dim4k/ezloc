/// <reference path="../pb_data/types.d.ts" />

/**
 * Size limits on booking requests (public form): text lengths and the options JSON.
 * Existing records are not checked again; the form inputs carry the same maxlength.
 */

const TEXT_LIMITS = { name: 120, arrival: 60, departure: 60, message: 5000, price_estimation: 40 };
const OPTIONS_MAX_SIZE = 10000;

migrate((app) => {
    let collection;
    try {
        collection = app.findCollectionByNameOrId("messages");
    } catch (e) {
        return;
    }

    Object.keys(TEXT_LIMITS).forEach((name) => {
        const field = collection.fields.getByName(name);
        if (field) field.max = TEXT_LIMITS[name];
    });
    const options = collection.fields.getByName("options");
    if (options) options.maxSize = OPTIONS_MAX_SIZE;

    app.save(collection);
}, (app) => {
    let collection;
    try {
        collection = app.findCollectionByNameOrId("messages");
    } catch (e) {
        return;
    }

    Object.keys(TEXT_LIMITS).forEach((name) => {
        const field = collection.fields.getByName(name);
        if (field) field.max = 0; // no limit
    });
    const options = collection.fields.getByName("options");
    if (options) options.maxSize = 2000000;

    app.save(collection);
});

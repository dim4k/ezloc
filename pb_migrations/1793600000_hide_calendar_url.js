/// <reference path="../pb_data/types.d.ts" />

/**
 * contact.airbnbUrl holds the private token of the Airbnb iCal export: hide it from the public API.
 * Superusers still see it in the dashboard, and pb_hooks/ical.pb.js reads it server-side.
 */

function setHidden(app, hidden) {
    let collection;
    try {
        collection = app.findCollectionByNameOrId("contact");
    } catch (e) {
        return;
    }
    const field = collection.fields.getByName("airbnbUrl");
    if (!field) return;
    field.hidden = hidden;
    app.save(collection);
}

migrate((app) => {
    setHidden(app, true);
}, (app) => {
    setHidden(app, false);
});

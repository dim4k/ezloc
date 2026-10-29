/// <reference path="../pb_data/types.d.ts" />

/**
 * Guest reviews, typed in the dashboard (copied from Airbnb, Google, a guest book…).
 * Shown by both themes between the map and the FAQ, newest stay first; empty = no section.
 */

migrate((app) => {
    try {
        app.findCollectionByNameOrId("reviews");
        return;
    } catch (e) {
        // not created yet
    }

    app.save(new Collection({
        type: "base",
        name: "reviews",
        listRule: "",
        viewRule: "",
        fields: [
            // First name, optionally with the city: "Marie, Nantes"
            { name: "author", type: "text", required: true },
            // Plain text, line breaks kept
            { name: "text", type: "text", required: true },
            { name: "rating", type: "number", min: 1, max: 5, onlyInt: true },
            // Stay date, shown as "juillet 2025"
            { name: "date", type: "date" },
            // "Airbnb", "Google"…
            { name: "source", type: "text" },
            { name: "created", type: "autodate", onCreate: true, onUpdate: false },
            { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
    }));
}, (app) => {
    try {
        app.delete(app.findCollectionByNameOrId("reviews"));
    } catch (e) {
        // already removed
    }
});

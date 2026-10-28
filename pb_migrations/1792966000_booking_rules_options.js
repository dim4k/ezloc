/// <reference path="../pb_data/types.d.ts" />

/**
 * Booking rules, options, guests and image thumbnails.
 * Additive only: new collections and optional fields. Empty values keep the previous behavior.
 */

migrate((app) => {
    // Small previews only: the uploaded photos are already web-sized, and larger
    // thumbnails re-encoded by PocketBase turned out heavier than the originals.
    const THUMBS = ["160x120"];

    const DATES = [
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ];

    function findCollection(name) {
        try {
            return app.findCollectionByNameOrId(name);
        } catch (e) {
            return null;
        }
    }

    function createCollection(config) {
        if (findCollection(config.name)) return;
        app.save(new Collection(Object.assign({ type: "base" }, config, { fields: config.fields.concat(DATES) })));
    }

    function addField(collectionName, field) {
        const collection = findCollection(collectionName);
        if (!collection || collection.fields.getByName(field.name)) return;
        collection.fields.add(new Field(field));
        app.save(collection);
    }

    // Declares thumbnail sizes on an existing file field
    function addThumbs(collectionName, fieldName) {
        const collection = findCollection(collectionName);
        if (!collection) return;
        const field = collection.fields.getByName(fieldName);
        if (!field || field.type() !== "file") return;

        const thumbs = [];
        for (let i = 0; i < (field.thumbs ? field.thumbs.length : 0); i++) thumbs.push(field.thumbs[i]);
        THUMBS.forEach((size) => {
            if (thumbs.indexOf(size) === -1) thumbs.push(size);
        });
        field.thumbs = thumbs;
        app.save(collection);
    }

    // 1. Stay rules (e.g. "fortnight only from 12/07 to 23/08")
    createCollection({
        name: "stay_rules",
        listRule: "",
        viewRule: "",
        fields: [
            { name: "label", type: "text" },
            { name: "start", type: "text", required: true },
            { name: "end", type: "text", required: true },
            { name: "min_nights", type: "number", min: 1, onlyInt: true },
            { name: "nights_multiple", type: "number", min: 1, onlyInt: true },
        ],
    });

    // 2. Paid options offered in the booking form (e.g. linen)
    createCollection({
        name: "booking_options",
        listRule: "",
        viewRule: "",
        fields: [
            { name: "name", type: "text", required: true },
            { name: "description", type: "text" },
            { name: "price", type: "number", required: true, min: 0 },
            { name: "unit", type: "select", required: true, maxSelect: 1, values: ["stay", "night", "guest", "guest_night"] },
            { name: "order", type: "number", onlyInt: true },
        ],
    });

    // 3. Optional fields on existing collections
    addField("house_config", { name: "max_guests", type: "number", min: 1, onlyInt: true });
    addField("messages", { name: "guests", type: "number", min: 1, onlyInt: true });
    addField("messages", { name: "options", type: "json", maxSize: 2000000 });

    // 4. Thumbnails for every image field (?thumb=WxH)
    addThumbs("welcome", "image");
    addThumbs("house_features", "thumbnail");
    addThumbs("house_features", "gallery");
    addThumbs("activities", "images");
}, (app) => {
    ["stay_rules", "booking_options"].forEach((name) => {
        try {
            app.delete(app.findCollectionByNameOrId(name));
        } catch (e) {
            // already removed
        }
    });

    [["house_config", "max_guests"], ["messages", "guests"], ["messages", "options"]].forEach(([collectionName, fieldName]) => {
        try {
            const collection = app.findCollectionByNameOrId(collectionName);
            if (collection.fields.getByName(fieldName)) {
                collection.fields.removeByName(fieldName);
                app.save(collection);
            }
        } catch (e) {
            // already removed
        }
    });
    // Thumbnail sizes are left in place: they do not change any data.
});

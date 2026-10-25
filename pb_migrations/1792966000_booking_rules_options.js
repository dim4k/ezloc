/// <reference path="../pb_data/types.d.ts" />

/**
 * Booking rules, options, guests and image thumbnails.
 * Additive only: new collections and optional fields. Empty values keep the previous behavior.
 */

migrate((db) => {
    const dao = new Dao(db);

    // Small previews only: the uploaded photos are already web-sized, and larger
    // thumbnails re-encoded by PocketBase turned out heavier than the originals.
    const THUMBS = ["160x120"];

    function findCollection(name) {
        try {
            return dao.findCollectionByNameOrId(name);
        } catch (e) {
            return null;
        }
    }

    function createCollection(config) {
        if (findCollection(config.name)) return;
        dao.saveCollection(new Collection(config));
    }

    function addField(collectionName, field) {
        const collection = findCollection(collectionName);
        if (!collection || collection.schema.getFieldByName(field.name)) return;
        collection.schema.addField(new SchemaField(field));
        dao.saveCollection(collection);
    }

    // Declares thumbnail sizes on an existing file field (same id: the field is replaced, not duplicated)
    function addThumbs(collectionName, fieldName) {
        const collection = findCollection(collectionName);
        if (!collection) return;
        const field = collection.schema.getFieldByName(fieldName);
        if (!field || field.type !== "file") return;

        const options = field.options;
        const thumbs = [];
        const mimeTypes = [];
        for (let i = 0; i < (options.thumbs ? options.thumbs.length : 0); i++) thumbs.push(options.thumbs[i]);
        for (let i = 0; i < (options.mimeTypes ? options.mimeTypes.length : 0); i++) mimeTypes.push(options.mimeTypes[i]);
        THUMBS.forEach((size) => {
            if (thumbs.indexOf(size) === -1) thumbs.push(size);
        });

        collection.schema.addField(new SchemaField({
            id: field.id,
            name: field.name,
            type: "file",
            system: field.system,
            required: field.required,
            presentable: field.presentable,
            options: {
                maxSelect: options.maxSelect,
                maxSize: options.maxSize,
                mimeTypes: mimeTypes,
                protected: options.protected,
                thumbs: thumbs,
            },
        }));
        dao.saveCollection(collection);
    }

    // 1. Stay rules (e.g. "fortnight only from 12/07 to 23/08")
    createCollection({
        name: "stay_rules",
        type: "base",
        system: false,
        listRule: "",
        viewRule: "",
        schema: [
            { name: "label", type: "text", required: false },
            { name: "start", type: "text", required: true },
            { name: "end", type: "text", required: true },
            { name: "min_nights", type: "number", required: false, options: { min: 1, max: null, noDecimal: true } },
            { name: "nights_multiple", type: "number", required: false, options: { min: 1, max: null, noDecimal: true } },
        ],
    });

    // 2. Paid options offered in the booking form (e.g. linen)
    createCollection({
        name: "booking_options",
        type: "base",
        system: false,
        listRule: "",
        viewRule: "",
        schema: [
            { name: "name", type: "text", required: true },
            { name: "description", type: "text", required: false },
            { name: "price", type: "number", required: true, options: { min: 0, max: null, noDecimal: false } },
            { name: "unit", type: "select", required: true, options: { maxSelect: 1, values: ["stay", "night", "guest", "guest_night"] } },
            { name: "order", type: "number", required: false, options: { min: null, max: null, noDecimal: true } },
        ],
    });

    // 3. Optional fields on existing collections
    addField("house_config", { name: "max_guests", type: "number", required: false, options: { min: 1, max: null, noDecimal: true } });
    addField("messages", { name: "guests", type: "number", required: false, options: { min: 1, max: null, noDecimal: true } });
    addField("messages", { name: "options", type: "json", required: false, options: { maxSize: 2000000 } });

    // 4. Thumbnails for every image field (?thumb=WxH)
    addThumbs("welcome", "image");
    addThumbs("house_features", "thumbnail");
    addThumbs("house_features", "gallery");
    addThumbs("activities", "images");
}, (db) => {
    const dao = new Dao(db);

    ["stay_rules", "booking_options"].forEach((name) => {
        try {
            dao.deleteCollection(dao.findCollectionByNameOrId(name));
        } catch (e) {
            // already removed
        }
    });

    [["house_config", "max_guests"], ["messages", "guests"], ["messages", "options"]].forEach(([collectionName, fieldName]) => {
        try {
            const collection = dao.findCollectionByNameOrId(collectionName);
            const field = collection.schema.getFieldByName(fieldName);
            if (field) {
                collection.schema.removeField(field.id);
                dao.saveCollection(collection);
            }
        } catch (e) {
            // already removed
        }
    });
    // Thumbnail sizes are left in place: they do not change any data.
});

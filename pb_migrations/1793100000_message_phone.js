/// <reference path="../pb_data/types.d.ts" />

/**
 * Optional phone number on booking requests.
 * Additive only: older front-ends simply never send it.
 */

migrate((db) => {
    const dao = new Dao(db);

    let collection;
    try {
        collection = dao.findCollectionByNameOrId("messages");
    } catch (e) {
        return;
    }
    if (collection.schema.getFieldByName("phone")) return;

    collection.schema.addField(new SchemaField({ name: "phone", type: "text", required: false, options: { min: null, max: 40, pattern: "" } }));
    dao.saveCollection(collection);
}, (db) => {
    const dao = new Dao(db);

    try {
        const collection = dao.findCollectionByNameOrId("messages");
        const field = collection.schema.getFieldByName("phone");
        if (field) {
            collection.schema.removeField(field.id);
            dao.saveCollection(collection);
        }
    } catch (e) {
        // already removed
    }
});

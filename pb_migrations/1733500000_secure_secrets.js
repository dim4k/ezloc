migrate((db) => {
    const dao = new Dao(db);

    // 1. Create 'site_secrets' collection (Admin Only)
    const secretsCollection = new Collection({
        "name": "site_secrets",
        "type": "base",
        "system": false,
        "listRule": null,   // Admin only
        "viewRule": null,   // Admin only
        "createRule": null, // Admin only
        "updateRule": null, // Admin only
        "deleteRule": null, // Admin only
        "schema": [
            { "name": "captchaSecretKey", "type": "text", "required": false }
        ]
    });
    dao.saveCollection(secretsCollection);

    // 2. Remove 'captchaSecretKey' from 'contact' collection
    try {
        const contactCollection = dao.findCollectionByNameOrId("contact");
        
        // Remove the field by filtering the schema
        contactCollection.schema.removeField("captchaSecretKey");
        
        dao.saveCollection(contactCollection);
    } catch (e) {
        console.log("Contact collection not found or update failed: " + e);
    }

}, (db) => {
    // Revert changes
    const dao = new Dao(db);

    // 1. Delete 'site_secrets'
    try {
        const collection = dao.findCollectionByNameOrId("site_secrets");
        dao.deleteCollection(collection);
    } catch (e) { }

    // 2. Add back 'captchaSecretKey' to 'contact' (simplified, order might be lost)
    try {
        const contactCollection = dao.findCollectionByNameOrId("contact");
        contactCollection.schema.addField(new SchemaField({
            "name": "captchaSecretKey",
            "type": "text"
        }));
        dao.saveCollection(contactCollection);
    } catch (e) { }
});

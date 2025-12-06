migrate((db) => {
    const dao = new Dao(db);

    try {
        const contactCollection = dao.findCollectionByNameOrId("contact");
        
        // Find the field by name
        const field = contactCollection.schema.getFieldByName("captchaSecretKey");
        if (field) {
            contactCollection.schema.removeField("captchaSecretKey");
            dao.saveCollection(contactCollection);
            console.log("✅ Successfully removed captchaSecretKey from contact collection.");
        } else {
            console.log("ℹ️ captchaSecretKey not found in contact collection (already removed?).");
        }
    } catch (e) {
        console.log("⚠️ Migration warning: " + e);
    }

}, (db) => {
    // Revert not implemented to avoid re-exposing secret
});

migrate((db) => {
    const dao = new Dao(db);

    const schema = [
        // 1. Site Identity (Singleton)
        {
            "name": "site_identity",
            "type": "base",
            "system": false,
            "listRule": "",
            "viewRule": "",
            "schema": [
                { "name": "name", "type": "text", "required": true },
                { "name": "tagline", "type": "text", "required": false },
                { "name": "description", "type": "text", "required": false },
                { "name": "favicon", "type": "file", "options": { "maxSelect": 1, "maxSize": 5242880, "mimeTypes": ["image/png","image/x-icon","image/svg+xml"] } },
                { "name": "labels", "type": "json", "options": { "maxSize": 5242880 }, "required": false }
            ]
        },
        // 2. Welcome Section (Singleton)
        {
            "name": "welcome",
            "type": "base",
            "system": false,
            "listRule": "",
            "viewRule": "",
            "schema": [
                { "name": "title", "type": "text", "required": false },
                { "name": "subtitle", "type": "text", "required": false },
                { "name": "image", "type": "file", "options": { "maxSelect": 1, "maxSize": 5242880, "mimeTypes": ["image/jpeg","image/png","image/webp"] } },
                { "name": "display_options", "type": "json", "options": { "maxSize": 5242880 }, "required": false }
            ]
        },
        // 3. House Config (Singleton)
        {
            "name": "house_config",
            "type": "base",
            "system": false,
            "listRule": "",
            "viewRule": "",
            "schema": [
                { "name": "title", "type": "text", "required": false },
                { "name": "subtitle", "type": "text", "required": false },
                { "name": "amenities", "type": "json", "options": { "maxSize": 5242880 }, "required": false }
            ]
        },
        // 4. House Features (List)
        {
            "name": "house_features",
            "type": "base",
            "system": false,
            "listRule": "",
            "viewRule": "",
            "schema": [
                { "name": "title", "type": "text", "required": true },
                { "name": "shortDesc", "type": "text" },
                { "name": "fullDesc", "type": "editor" },
                { "name": "icon", "type": "text" },
                { "name": "thumbnail", "type": "file", "options": { "maxSelect": 1, "maxSize": 5242880, "mimeTypes": ["image/jpeg","image/png","image/webp"] } },
                { "name": "gallery", "type": "file", "options": { "maxSelect": 20, "maxSize": 5242880, "mimeTypes": ["image/jpeg","image/png","image/webp"] } },
                { "name": "order", "type": "number", "options": { "noDecimal": true } }
            ]
        },
        // 5. Activities Config (Singleton)
        {
            "name": "activities_config",
            "type": "base",
            "system": false,
            "listRule": "",
            "viewRule": "",
            "schema": [
                { "name": "title", "type": "text", "required": false },
                { "name": "subtitle", "type": "text", "required": false }
            ]
        },
        // 6. Activities (List)
        {
            "name": "activities",
            "type": "base",
            "system": false,
            "listRule": "",
            "viewRule": "",
            "schema": [
                { "name": "title", "type": "text", "required": true },
                { "name": "description", "type": "editor" },
                { "name": "images", "type": "file", "options": { "maxSelect": 10, "maxSize": 5242880, "mimeTypes": ["image/jpeg","image/png","image/webp"] } },
                { "name": "order", "type": "number", "options": { "noDecimal": true } }
            ]
        },
        // 7. Contact (Singleton)
        {
            "name": "contact",
            "type": "base",
            "system": false,
            "listRule": "",
            "viewRule": "",
            "schema": [
                { "name": "email", "type": "email" },
                { "name": "phone", "type": "text" },
                { "name": "name", "type": "text" },
                { "name": "airbnbUrl", "type": "url" },
                { "name": "captchaSiteKey", "type": "text" },
                { "name": "captchaSecretKey", "type": "text" }
            ]
        },
        // 8. Location (Singleton)
        {
            "name": "location",
            "type": "base",
            "system": false,
            "listRule": "",
            "viewRule": "",
            "schema": [
                { "name": "lat", "type": "number" },
                { "name": "lng", "type": "number" },
                { "name": "address", "type": "text" },
                { "name": "zoom", "type": "number" }
            ]
        },
        // 9. Pricing Config (Singleton)
        {
            "name": "pricing_config",
            "type": "base",
            "system": false,
            "listRule": "",
            "viewRule": "",
            "schema": [
                { "name": "cleaningFee", "type": "number" },
                { "name": "defaultPrice", "type": "number" },
                { "name": "details", "type": "json", "options": { "maxSize": 5242880 } }
            ]
        },
        // 10. Pricing Periods (List)
        {
            "name": "pricing_periods",
            "type": "base",
            "system": false,
            "listRule": "",
            "viewRule": "",
            "schema": [
                { "name": "start", "type": "text", "required": true },
                { "name": "end", "type": "text", "required": true },
                { "name": "price", "type": "number", "required": true }
            ]
        },
        // 11. FAQ (List)
        {
            "name": "faq",
            "type": "base",
            "system": false,
            "listRule": "",
            "viewRule": "",
            "schema": [
                { "name": "question", "type": "text", "required": true },
                { "name": "answer", "type": "editor", "required": true },
                { "name": "order", "type": "number", "options": { "noDecimal": true } }
            ]
        },
        // 12. Messages (List)
        {
            "name": "messages",
            "type": "base",
            "system": false,
            "createRule": "",
            "schema": [
                { "name": "name", "type": "text", "required": true },
                { "name": "email", "type": "email", "required": true },
                { "name": "arrival", "type": "text" },
                { "name": "departure", "type": "text" },
                { "name": "message", "type": "text", "required": true },
                { "name": "price_estimation", "type": "text" }
            ]
        }
    ];

    schema.forEach((colConfig) => {
        try {
            // Check if collection exists
            const existing = dao.findCollectionByNameOrId(colConfig.name);
            
            // If it exists, we could check if we need to update it, 
            // but for this initial migration we'll assume existence means it's good.
            // If you want to force re-creation or update, logic goes here.
            
            // For now, let's update simple properties just in case
            existing.listRule = colConfig.listRule;
            existing.viewRule = colConfig.viewRule;
            existing.createRule = colConfig.createRule;
            existing.updateRule = colConfig.updateRule;
            existing.deleteRule = colConfig.deleteRule;
            
            dao.saveCollection(existing);

        } catch (e) {
            // Does not exist, create it
            const collection = new Collection(colConfig);
            
            // We need to ensure IDs are consistent if provided, 
            // but usually new Collection() handles it if strict is not enforced?
            // Actually, if we pass specific IDs for fields, PB honors them.
            
            dao.saveCollection(collection);
        }
    });
}, (db) => {
    // down migration - typically we don't delete data in 'down' for initial schema
    // unless strictly required.
    // return null;
});

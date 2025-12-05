migrate((db) => {
    const dao = new Dao(db);

    const schema = [
        {
            "name": "site_info",
            "type": "base",
            "system": false,
            "schema": [
                {
                    "system": false,
                    "id": "general_name",
                    "name": "name",
                    "type": "text",
                    "required": true,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "general_tagline",
                    "name": "tagline",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "general_description",
                    "name": "description",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "hero_title",
                    "name": "heroTitle",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "hero_subtitle",
                    "name": "heroSubtitle",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "island_title",
                    "name": "islandTitle",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "island_subtitle",
                    "name": "islandSubtitle",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "hero_image",
                    "name": "heroImage",
                    "type": "file",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "maxSelect": 1,
                        "maxSize": 5242880,
                        "mimeTypes": ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"],
                        "thumbs": [],
                        "protected": false
                    }
                },
                {
                    "system": false,
                    "id": "site_favicon",
                    "name": "favicon",
                    "type": "file",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "maxSelect": 1,
                        "maxSize": 5242880,
                        "mimeTypes": [
                            "image/png",
                            "image/x-icon",
                            "image/svg+xml",
                            "image/vnd.microsoft.icon"
                        ],
                        "thumbs": [],
                        "protected": false
                    }
                },
                {
                    "system": false,
                    "id": "raw_labels",
                    "name": "labels",
                    "type": "json",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "maxSize": 2000000
                    }
                },
                {
                    "system": false,
                    "id": "raw_amenities",
                    "name": "amenities",
                    "type": "json",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "maxSize": 2000000
                    }
                }
            ],
            "indexes": [],
            "listRule": "",
            "viewRule": "",
            "createRule": null,
            "updateRule": null,
            "deleteRule": null,
            "options": {}
        },
        {
            "name": "contact",
            "type": "base",
            "system": false,
            "schema": [
                {
                    "system": false,
                    "id": "contact_email",
                    "name": "email",
                    "type": "email",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "exceptDomains": [],
                        "onlyDomains": []
                    }
                },
                {
                    "system": false,
                    "id": "contact_phone",
                    "name": "phone",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "contact_name",
                    "name": "name",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "airbnb_url",
                    "name": "airbnbUrl",
                    "type": "url",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "exceptDomains": [],
                        "onlyDomains": []
                    }
                },
                {
                    "system": false,
                    "id": "captcha_site",
                    "name": "captchaSiteKey",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "captcha_secret",
                    "name": "captchaSecretKey",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                }
            ],
            "indexes": [],
            "listRule": "",
            "viewRule": "",
            "createRule": null,
            "updateRule": null,
            "deleteRule": null,
            "options": {}
        },
        {
            "name": "messages",
            "type": "base",
            "system": false,
            "schema": [
                {
                    "system": false,
                    "id": "msg_name",
                    "name": "name",
                    "type": "text",
                    "required": true,
                    "presentable": true,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "msg_email",
                    "name": "email",
                    "type": "email",
                    "required": true,
                    "presentable": true,
                    "unique": false,
                    "options": {
                        "exceptDomains": [],
                        "onlyDomains": []
                    }
                },
                {
                    "system": false,
                    "id": "msg_arrival",
                    "name": "arrival",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "msg_departure",
                    "name": "departure",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "msg_content",
                    "name": "message",
                    "type": "text",
                    "required": true,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "msg_price",
                    "name": "price_estimation",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                }
            ],
            "indexes": [],
            "listRule": null,
            "viewRule": null,
            "createRule": "",
            "updateRule": null,
            "deleteRule": null,
            "options": {}
        },
        {
            "name": "location",
            "type": "base",
            "system": false,
            "schema": [
                {
                    "system": false,
                    "id": "loc_lat",
                    "name": "lat",
                    "type": "number",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "noDecimal": false
                    }
                },
                {
                    "system": false,
                    "id": "loc_lng",
                    "name": "lng",
                    "type": "number",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "noDecimal": false
                    }
                },
                {
                    "system": false,
                    "id": "loc_addr",
                    "name": "address",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "loc_zoom",
                    "name": "zoom",
                    "type": "number",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "noDecimal": false
                    }
                }
            ],
            "indexes": [],
            "listRule": "",
            "viewRule": "",
            "createRule": null,
            "updateRule": null,
            "deleteRule": null,
            "options": {}
        },
        {
            "name": "pricing_config",
            "type": "base",
            "system": false,
            "schema": [
                {
                    "system": false,
                    "id": "pricing_cleaning",
                    "name": "cleaningFee",
                    "type": "number",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "noDecimal": false
                    }
                },
                 {
                    "system": false,
                    "id": "pricing_default",
                    "name": "defaultPrice",
                    "type": "number",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "noDecimal": false
                    }
                },
                {
                    "system": false,
                    "id": "pricing_details",
                    "name": "details",
                    "type": "json",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "maxSize": 2000000
                    }
                }
            ],
            "indexes": [],
            "listRule": "",
            "viewRule": "",
            "createRule": null,
            "updateRule": null,
            "deleteRule": null,
            "options": {}
        },
        {
            "name": "pricing_periods",
            "type": "base",
            "system": false,
            "schema": [
                {
                    "system": false,
                    "id": "period_start",
                    "name": "start",
                    "type": "text",
                    "required": true,
                    "presentable": true,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "period_end",
                    "name": "end",
                    "type": "text",
                    "required": true,
                    "presentable": true,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "period_price",
                    "name": "price",
                    "type": "number",
                    "required": true,
                    "presentable": true,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "noDecimal": false
                    }
                }
            ],
            "indexes": [],
            "listRule": "",
            "viewRule": "",
            "createRule": null,
            "updateRule": null,
            "deleteRule": null,
            "options": {}
        },
        {
            "name": "features",
            "type": "base",
            "system": false,
            "schema": [
                {
                    "system": false,
                    "id": "feat_title",
                    "name": "title",
                    "type": "text",
                    "required": true,
                    "presentable": true,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "feat_short",
                    "name": "shortDesc",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "feat_full",
                    "name": "fullDesc",
                    "type": "editor",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "convertUrls": false
                    }
                },
                {
                    "system": false,
                    "id": "feat_icon",
                    "name": "icon",
                    "type": "text",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "feat_thumb",
                    "name": "thumbnail",
                    "type": "file",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "maxSelect": 1,
                        "maxSize": 5242880,
                        "mimeTypes": ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"],
                        "thumbs": [],
                        "protected": false
                    }
                },
                {
                    "system": false,
                    "id": "feat_gallery",
                    "name": "gallery",
                    "type": "file",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "maxSelect": 20,
                        "maxSize": 5242880,
                        "mimeTypes": ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"],
                        "thumbs": [],
                        "protected": false
                    }
                },
                {
                    "system": false,
                    "id": "feat_order",
                    "name": "order",
                    "type": "number",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "noDecimal": true
                    }
                }
            ],
            "indexes": [],
            "listRule": "",
            "viewRule": "",
            "createRule": null,
            "updateRule": null,
            "deleteRule": null,
            "options": {}
        },
        {
            "name": "activities",
            "type": "base",
            "system": false,
            "schema": [
                {
                    "system": false,
                    "id": "act_title",
                    "name": "title",
                    "type": "text",
                    "required": true,
                    "presentable": true,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "act_desc",
                    "name": "description",
                    "type": "editor",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "convertUrls": false
                    }
                },
                {
                    "system": false,
                    "id": "act_imgs",
                    "name": "images",
                    "type": "file",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "maxSelect": 10,
                        "maxSize": 5242880,
                        "mimeTypes": ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"],
                        "thumbs": [],
                        "protected": false
                    }
                },
                {
                    "system": false,
                    "id": "act_order",
                    "name": "order",
                    "type": "number",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "noDecimal": true
                    }
                }
            ],
            "indexes": [],
            "listRule": "",
            "viewRule": "",
            "createRule": null,
            "updateRule": null,
            "deleteRule": null,
            "options": {}
        },
        {
            "name": "faq",
            "type": "base",
            "system": false,
            "schema": [
                {
                    "system": false,
                    "id": "faq_question",
                    "name": "question",
                    "type": "text",
                    "required": true,
                    "presentable": true,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "pattern": ""
                    }
                },
                {
                    "system": false,
                    "id": "faq_answer",
                    "name": "answer",
                    "type": "editor",
                    "required": true,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "convertUrls": false
                    }
                },
                {
                    "system": false,
                    "id": "faq_order",
                    "name": "order",
                    "type": "number",
                    "required": false,
                    "presentable": false,
                    "unique": false,
                    "options": {
                        "min": null,
                        "max": null,
                        "noDecimal": true
                    }
                }
            ],
            "indexes": [],
            "listRule": "",
            "viewRule": "",
            "createRule": null,
            "updateRule": null,
            "deleteRule": null,
            "options": {}
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

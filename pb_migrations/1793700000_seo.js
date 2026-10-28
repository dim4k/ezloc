/// <reference path="../pb_data/types.d.ts" />

/**
 * Search engines and AI answer engines (see pb_hooks/seo.pb.js):
 * - house_config: bedrooms, bathrooms, check-in / check-out times for the structured data
 * - site_identity.external_links: the listing's other pages (Airbnb, Google Maps…), as "sameAs"
 * - pages: legal notice and privacy policy, created as unpublished drafts to complete
 * - 1200x630 thumbnails of the hero photos, used as the share image (Open Graph)
 * Additive only: empty values keep the previous behavior.
 */

const SHARE_THUMB = "1200x630";

function findCollection(app, name) {
    try {
        return app.findCollectionByNameOrId(name);
    } catch (e) {
        return null;
    }
}

function addField(app, collectionName, field) {
    const collection = findCollection(app, collectionName);
    if (!collection || collection.fields.getByName(field.name)) return;
    collection.fields.add(new Field(field));
    app.save(collection);
}

function removeField(app, collectionName, fieldName) {
    const collection = findCollection(app, collectionName);
    if (!collection || !collection.fields.getByName(fieldName)) return;
    collection.fields.removeByName(fieldName);
    app.save(collection);
}

function addThumb(app, collectionName, fieldName) {
    const collection = findCollection(app, collectionName);
    const field = collection && collection.fields.getByName(fieldName);
    if (!field || field.type() !== "file") return;

    const thumbs = [];
    for (let i = 0; i < (field.thumbs ? field.thumbs.length : 0); i++) thumbs.push(field.thumbs[i]);
    if (thumbs.indexOf(SHARE_THUMB) !== -1) return;
    thumbs.push(SHARE_THUMB);
    field.thumbs = thumbs;
    app.save(collection);
}

function firstRecord(app, collectionName) {
    try {
        return app.findRecordsByFilter(collectionName, "id != ''", "-created", 1, 0)[0] || null;
    } catch (e) {
        return null;
    }
}

const TODO = "<strong>[À compléter]</strong>";

/** Drafts filled with what the CMS already knows (owner, address, contact details). */
function legalDrafts(app) {
    const contact = firstRecord(app, "contact");
    const location = firstRecord(app, "location");
    const owner = (contact && contact.getString("name")) || TODO;
    const address = (location && location.getString("address")) || TODO;
    const email = (contact && contact.getString("email")) || TODO;
    const phone = (contact && contact.getString("phone")) || TODO;

    return [
        {
            slug: "mentions-legales",
            title: "Mentions légales",
            content: `
<h2>Éditeur du site</h2>
<p>${owner}<br>${address}<br>Email : ${email}<br>Téléphone : ${phone}</p>
<p>Directeur de la publication : ${owner}</p>
<h2>Hébergement</h2>
<p>${TODO} Nom, adresse et téléphone de l'hébergeur du site.</p>
<h2>Meublé de tourisme</h2>
<p>Numéro d'enregistrement : ${TODO} (obligatoire si la commune l'impose).<br>Classement : ${TODO} (si le meublé est classé).</p>
<h2>Propriété intellectuelle</h2>
<p>Les textes et photographies de ce site appartiennent à ${owner}. Toute reproduction sans autorisation est interdite.</p>
<h2>Données personnelles</h2>
<p>Voir la <a href="/confidentialite">politique de confidentialité</a>.</p>`,
        },
        {
            slug: "confidentialite",
            title: "Politique de confidentialité",
            content: `
<h2>Responsable du traitement</h2>
<p>${owner}, ${email}.</p>
<h2>Données collectées</h2>
<p>Le formulaire de réservation collecte votre nom, votre email, votre téléphone, les dates et le nombre de voyageurs souhaités, ainsi que votre message. Ces données servent uniquement à répondre à votre demande et à organiser votre séjour.</p>
<h2>Destinataires</h2>
<p>Vos données ne sont ni vendues ni cédées. Les emails sont envoyés par ${TODO} (prestataire d'envoi d'emails).</p>
<h2>Durée de conservation</h2>
<p>${TODO} Par exemple : 3 ans après le dernier contact.</p>
<h2>Cookies</h2>
<p>Ce site ne dépose pas de cookie de mesure d'audience ni de publicité. La carte affiche des fonds de plan OpenStreetMap, chargés depuis leurs serveurs.</p>
<h2>Vos droits</h2>
<p>Vous pouvez accéder à vos données, les faire rectifier ou supprimer en écrivant à ${email}. Vous pouvez aussi adresser une réclamation à la CNIL (cnil.fr).</p>`,
        },
    ];
}

migrate((app) => {
    // 1. Structured facts about the house
    addField(app, "house_config", { name: "bedrooms", type: "number", min: 0, onlyInt: true });
    addField(app, "house_config", { name: "bathrooms", type: "number", min: 0, onlyInt: true });
    addField(app, "house_config", { name: "checkin_time", type: "text", pattern: "^([01][0-9]|2[0-3]):[0-5][0-9]$" });
    addField(app, "house_config", { name: "checkout_time", type: "text", pattern: "^([01][0-9]|2[0-3]):[0-5][0-9]$" });

    // Prefilled from the amenities ("3 Chambres", "2 Salles de bain") when they say it
    const house = firstRecord(app, "house_config");
    if (house) {
        let amenities = "";
        try {
            amenities = JSON.parse(house.getString("amenities") || "[]").join(" | ");
        } catch (e) {
            // not a list
        }
        const bedrooms = amenities.match(/(\d+)\s*chambres?/i);
        const bathrooms = amenities.match(/(\d+)\s*salles? de bains?/i);
        if (bedrooms && !house.getInt("bedrooms")) house.set("bedrooms", parseInt(bedrooms[1], 10));
        if (bathrooms && !house.getInt("bathrooms")) house.set("bathrooms", parseInt(bathrooms[1], 10));
        app.save(house);
    }

    // 2. Other pages about the same listing (JSON list of URLs)
    addField(app, "site_identity", { name: "external_links", type: "json", maxSize: 20000 });

    // 3. Legal pages, served at /mentions-legales and /confidentialite once published
    if (!findCollection(app, "pages")) {
        app.save(new Collection({
            type: "base",
            name: "pages",
            listRule: "published = true",
            viewRule: "published = true",
            fields: [
                { name: "slug", type: "text", required: true, pattern: "^[a-z0-9-]+$" },
                { name: "title", type: "text", required: true },
                { name: "content", type: "editor" },
                { name: "published", type: "bool" },
                { name: "created", type: "autodate", onCreate: true, onUpdate: false },
                { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
            ],
            indexes: ["CREATE UNIQUE INDEX idx_pages_slug ON pages (slug)"],
        }));

        const pages = app.findCollectionByNameOrId("pages");
        legalDrafts(app).forEach((draft) => {
            const record = new Record(pages);
            record.load(Object.assign({ published: false }, draft));
            app.save(record);
        });
    }

    // 4. Share image: the first hero photo (or welcome.image) cropped to 1200x630
    addThumb(app, "hero_slides", "image");
    addThumb(app, "welcome", "image");
}, (app) => {
    ["bedrooms", "bathrooms", "checkin_time", "checkout_time"].forEach((name) => removeField(app, "house_config", name));
    removeField(app, "site_identity", "external_links");
    const pages = findCollection(app, "pages");
    if (pages) app.delete(pages);
    // Thumbnail sizes are left in place: they do not change any data.
});

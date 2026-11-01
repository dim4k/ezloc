/// <reference path="../pb_data/types.d.ts" />

/**
 * Anonymizes old booking requests (see lib/anonymize.js): every night at 3:00,
 * and at startup so a new MESSAGES_ANONYMIZE_DAYS value applies right after a restart
 * (onServe rather than onBootstrap: the migrations have run, so the collection exists).
 */
cronAdd("anonymize_messages", "0 3 * * *", () => {
    require(`${__hooks}/lib/anonymize.js`).anonymizeMessages($app);
});

onServe((e) => {
    require(`${__hooks}/lib/anonymize.js`).anonymizeMessages(e.app);
    return e.next();
});

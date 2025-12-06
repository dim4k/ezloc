/// <reference path="../pb_data/types.d.ts" />

onRecordBeforeCreateRequest((e) => {
    const collection = e.collection;
    if (collection.name !== 'messages') {
        return; // Only verify for messages
    }

    // 1. Check if Captcha is enabled (Secret Key exists in DB)
    let secretRecord;
    try {
        // Try to get the first record from site_secrets
        const result = $app.dao().findRecordsByFilter("site_secrets", "captchaSecretKey != ''", "-created", 1);
        if (result && result.length > 0) {
            secretRecord = result[0];
        }
    } catch (e) {
        // Collection might not exist or empty
    }

    if (!secretRecord) {
        // No record found with a key, so captcha is disabled/not configured.
        return;
    }

    const secretKey = secretRecord.get("captchaSecretKey");
    if (!secretKey) {
        return; // Double check
    }

    // 2. Check for Token
    const requestInfo = e.requestInfo();
    const data = requestInfo.body;
    const captchaToken = data.captchaToken;

    if (!captchaToken) {
        throw new BadRequestError("Captcha token is missing.");
    }

    // Verify with Cloudflare
    try {
        const res = $http.send({
            url: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            method: "POST",
            body: JSON.stringify({
                secret: secretKey,
                response: captchaToken,
                remoteip: requestInfo.ip // Optional
            }),
            headers: { "Content-Type": "application/json" },
            timeout: 5 // seconds
        });

        if (res.statusCode !== 200) {
             throw new BadRequestError("Failed to verify captcha with Cloudflare.");
        }

        const resData = res.json;
        if (!resData.success) {
            throw new BadRequestError("Invalid captcha. Please try again.");
        }

    } catch (err) {
        // If network error or other issue
        throw new BadRequestError("Captcha verification failed: " + err.message);
    }

    // Remove the token from the data so it doesn't try to save to the record (if schema doesn't have it)
    // Although extra fields are usually ignored, it's cleaner.
    // e.record.set("captchaToken", null); // Not needed if field doesn't exist

}, "messages");

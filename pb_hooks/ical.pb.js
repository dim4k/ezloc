/// <reference path="../pb_data/types.d.ts" />

// Custom endpoint to fetch iCal data server-side (bypassing CORS)
routerAdd("GET", "/api/ical-proxy", (e) => {
    const url = e.request.url.query().get("url");

    if (!url) {
        return e.json(400, { error: "Missing url parameter" });
    }

    try {
        const res = $http.send({
            url: url,
            method: "GET",
            timeout: 10 // 10 seconds timeout
        });

        if (res.statusCode >= 400) {
            return e.json(res.statusCode, { error: "Remote server returned error" });
        }

        // Return the raw text content (iCal data)
        return e.string(200, toString(res.body));

    } catch (err) {
        return e.json(500, { error: "Failed to fetch iCal", details: err.toString() });
    }
});

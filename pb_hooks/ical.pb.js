
// Custom endpoint to fetch iCal data server-side (bypassing CORS)
routerAdd("GET", "/api/ical-proxy", (c) => {
    const url = c.queryParam("url");
    
    if (!url) {
        return c.json(400, { error: "Missing url parameter" });
    }

    try {
        const res = $http.send({
            url: url,
            method: "GET",
            timeout: 10 // 10 seconds timeout
        });

        if (res.statusCode >= 400) {
            return c.json(res.statusCode, { error: "Remote server returned error" });
        }

        // Return the raw text content (iCal data)
        return c.string(200, res.raw);

    } catch (err) {
        return c.json(500, { error: "Failed to fetch iCal", details: err.toString() });
    }
});

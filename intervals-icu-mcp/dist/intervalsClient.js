/**
 * Minimal REST client for the Intervals.icu API.
 *
 * Auth: HTTP Basic, username "API_KEY", password = the user's personal API key
 * (generated at https://intervals.icu/settings under "Developer Settings").
 *
 * Docs: https://intervals.icu/api-docs.html
 */
const BASE_URL = "https://intervals.icu/api/v1";
export class IntervalsApiError extends Error {
    status;
    body;
    constructor(status, body) {
        super(`Intervals.icu API error ${status}: ${body}`);
        this.status = status;
        this.body = body;
    }
}
function authHeader(apiKey) {
    const token = Buffer.from(`API_KEY:${apiKey}`).toString("base64");
    return `Basic ${token}`;
}
async function request(config, method, path, body) {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
        method,
        headers: {
            Authorization: authHeader(config.apiKey),
            "Content-Type": "application/json",
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
        throw new IntervalsApiError(res.status, text);
    }
    if (!text) {
        return undefined;
    }
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
/* ---------------------------------------------------------------------- */
/* Client                                                                  */
/* ---------------------------------------------------------------------- */
export class IntervalsClient {
    config;
    constructor(config) {
        this.config = config;
    }
    athletePath(suffix) {
        return `/athlete/${this.config.athleteId}${suffix}`;
    }
    async getProfile() {
        return request(this.config, "GET", this.athletePath("/profile"));
    }
    async getSportSettings() {
        return request(this.config, "GET", this.athletePath("/sport-settings"));
    }
    async listEvents(params) {
        const qs = new URLSearchParams({
            oldest: params.oldest,
            newest: params.newest,
        });
        if (params.category)
            qs.set("category", params.category);
        return request(this.config, "GET", this.athletePath(`/events?${qs.toString()}`));
    }
    async getEvent(eventId) {
        return request(this.config, "GET", this.athletePath(`/events/${eventId}`));
    }
    async createEvent(event) {
        return request(this.config, "POST", this.athletePath("/events"), event);
    }
    async createEvents(events) {
        // Bulk create — Intervals.icu accepts an array on the same endpoint.
        return request(this.config, "POST", this.athletePath("/events/bulk"), events);
    }
    async updateEvent(eventId, patch) {
        return request(this.config, "PUT", this.athletePath(`/events/${eventId}`), patch);
    }
    async deleteEvent(eventId) {
        await request(this.config, "DELETE", this.athletePath(`/events/${eventId}`));
    }
    async getWellness(params) {
        const qs = new URLSearchParams({
            oldest: params.oldest,
            newest: params.newest,
        });
        return request(this.config, "GET", this.athletePath(`/wellness?${qs.toString()}`));
    }
}

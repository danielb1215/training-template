/**
 * Minimal REST client for the Intervals.icu API.
 *
 * Auth: HTTP Basic, username "API_KEY", password = the user's personal API key
 * (generated at https://intervals.icu/settings under "Developer Settings").
 *
 * Docs: https://intervals.icu/api-docs.html
 */

const BASE_URL = "https://intervals.icu/api/v1";

export interface IntervalsConfig {
  apiKey: string;
  athleteId: string; // numeric athlete id, or "0" to auto-resolve to the key owner
}

export class IntervalsApiError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`Intervals.icu API error ${status}: ${body}`);
    this.status = status;
    this.body = body;
  }
}

function authHeader(apiKey: string): string {
  const token = Buffer.from(`API_KEY:${apiKey}`).toString("base64");
  return `Basic ${token}`;
}

async function request<T>(
  config: IntervalsConfig,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
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
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/* ---------------------------------------------------------------------- */
/* Types                                                                   */
/* ---------------------------------------------------------------------- */

export type EventCategory =
  | "WORKOUT"
  | "RACE_A"
  | "RACE_B"
  | "RACE_C"
  | "NOTE"
  | "HOLIDAY"
  | "SICK"
  | "INJURED"
  | "TARGET";

export interface CalendarEvent {
  id?: number;
  external_id?: string;
  category: EventCategory;
  start_date_local: string; // "YYYY-MM-DD" or full ISO local datetime
  name: string;
  type?: string; // "Ride", "Run", "Swim", "WeightTraining", etc.
  description?: string; // structured workout text goes here (see workoutText below)
  moving_time?: number; // seconds, rough planned duration
  distance?: number; // metres, optional planned distance
  icu_training_load?: number; // optional planned TSS-like load
  color?: string;
}

export interface Athlete {
  id: string;
  name: string;
  timezone?: string;
  [key: string]: unknown;
}

export interface SportSettings {
  id: string;
  ftp?: number;
  lthr?: number;
  max_hr?: number;
  [key: string]: unknown;
}

export interface WellnessEntry {
  id: string;           // YYYY-MM-DD
  ctl?: number;         // Chronic Training Load (fitness)
  atl?: number;         // Acute Training Load (fatigue)
  form?: number;        // TSB = CTL - ATL (form/freshness)
  rampRate?: number;    // CTL change per day
  restingHR?: number;   // bpm from Garmin/device
  hrv?: number;         // HRV4Training or compatible device
  hrvSDNN?: number;     // SDNN ms — higher is better
  sleepSecs?: number;   // seconds of sleep
  sleepScore?: number;  // 0–100 sleep quality score (Garmin)
  sleepQuality?: number;// manual 1–5 entry
  weight?: number;      // kg
  fatigue?: number;     // manual 1–5 (1=fresh, 5=very tired)
  mood?: number;        // manual 1–5
  motivation?: number;  // manual 1–5
  [key: string]: unknown;
}

/* ---------------------------------------------------------------------- */
/* Client                                                                  */
/* ---------------------------------------------------------------------- */

export class IntervalsClient {
  constructor(private config: IntervalsConfig) {}

  private athletePath(suffix: string): string {
    return `/athlete/${this.config.athleteId}${suffix}`;
  }

  async getProfile(): Promise<Athlete> {
    return request<Athlete>(this.config, "GET", this.athletePath("/profile"));
  }

  async getSportSettings(): Promise<SportSettings[]> {
    return request<SportSettings[]>(
      this.config,
      "GET",
      this.athletePath("/sport-settings")
    );
  }

  async listEvents(params: {
    oldest: string; // YYYY-MM-DD
    newest: string; // YYYY-MM-DD
    category?: EventCategory;
  }): Promise<CalendarEvent[]> {
    const qs = new URLSearchParams({
      oldest: params.oldest,
      newest: params.newest,
    });
    if (params.category) qs.set("category", params.category);
    return request<CalendarEvent[]>(
      this.config,
      "GET",
      this.athletePath(`/events?${qs.toString()}`)
    );
  }

  async getEvent(eventId: number): Promise<CalendarEvent> {
    return request<CalendarEvent>(
      this.config,
      "GET",
      this.athletePath(`/events/${eventId}`)
    );
  }

  async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
    return request<CalendarEvent>(
      this.config,
      "POST",
      this.athletePath("/events"),
      event
    );
  }

  async createEvents(events: CalendarEvent[]): Promise<CalendarEvent[]> {
    // Bulk create — Intervals.icu accepts an array on the same endpoint.
    return request<CalendarEvent[]>(
      this.config,
      "POST",
      this.athletePath("/events/bulk"),
      events
    );
  }

  async updateEvent(
    eventId: number,
    patch: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    return request<CalendarEvent>(
      this.config,
      "PUT",
      this.athletePath(`/events/${eventId}`),
      patch
    );
  }

  async deleteEvent(eventId: number): Promise<void> {
    await request<void>(
      this.config,
      "DELETE",
      this.athletePath(`/events/${eventId}`)
    );
  }

  async getWellness(params: {
    oldest: string; // YYYY-MM-DD
    newest: string; // YYYY-MM-DD
  }): Promise<WellnessEntry[]> {
    const qs = new URLSearchParams({
      oldest: params.oldest,
      newest: params.newest,
    });
    return request<WellnessEntry[]>(
      this.config,
      "GET",
      this.athletePath(`/wellness?${qs.toString()}`)
    );
  }
}

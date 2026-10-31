#!/usr/bin/env node
/**
 * Intervals.icu MCP Server
 *
 * Exposes tools to create, list, update, and delete planned workouts
 * (calendar events) on Intervals.icu. Workouts created here appear on
 * the athlete's Intervals.icu calendar; if the athlete has connected
 * Garmin Connect inside Intervals.icu (Settings > Garmin), they sync
 * to the Garmin device automatically as structured workouts.
 *
 * Configuration (environment variables):
 *   INTERVALS_API_KEY   required. From intervals.icu/settings > Developer Settings.
 *   INTERVALS_ATHLETE_ID  optional. Defaults to "0" (auto-resolves to the key owner).
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { IntervalsClient, IntervalsApiError, } from "./intervalsClient.js";
import { renderWorkoutText, totalDuration, thresholdSession, vo2maxSession, sprintSession, endurance, } from "./workoutBuilder.js";
const apiKey = process.env.INTERVALS_API_KEY;
if (!apiKey) {
    console.error("Missing INTERVALS_API_KEY environment variable. Generate one at https://intervals.icu/settings (Developer Settings).");
    process.exit(1);
}
const athleteId = process.env.INTERVALS_ATHLETE_ID ?? "0";
const client = new IntervalsClient({ apiKey, athleteId });
/**
 * Normalize a calendar date into the format the Intervals.icu /events
 * endpoint requires for `start_date_local`. The API rejects a bare
 * "YYYY-MM-DD" (422 "could not be parsed at index 10") and expects a full
 * local datetime, so append a midnight time component when only a date is
 * given. Values that already carry a time are passed through unchanged.
 */
function toStartDateLocal(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00` : date;
}
/* ---------------------------------------------------------------------- */
/* Zod schemas for tool inputs                                            */
/* ---------------------------------------------------------------------- */
const stepSchema = z.object({
    duration: z.number().int().positive().describe("Duration in seconds"),
    targetLowPct: z
        .number()
        .describe("Lower bound of target zone, e.g. 88 for 88% FTP"),
    targetHighPct: z
        .number()
        .describe("Upper bound of target zone, e.g. 95 for 95% FTP"),
    targetType: z.enum(["FTP", "LTHR", "MaxHR"]).optional(),
    label: z.string().optional(),
    cadence: z.number().int().positive().optional(),
});
const repeatSchema = z.object({
    count: z.number().int().positive(),
    steps: z.array(stepSchema).min(1),
});
const blockSchema = z.union([stepSchema, repeatSchema]);
const createCustomWorkoutSchema = z.object({
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Date in YYYY-MM-DD format"),
    name: z.string().describe("Workout name, e.g. 'Threshold 3x12min'"),
    sport: z
        .enum(["Ride", "VirtualRide", "Run", "Swim", "WeightTraining", "Other"])
        .default("Ride"),
    blocks: z
        .array(blockSchema)
        .min(1)
        .describe("Ordered list of steps and/or repeat blocks making up the workout"),
    notes: z.string().optional().describe("Extra free-text notes to append"),
});
const createTemplateWorkoutSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    template: z.enum(["threshold", "vo2max", "sprint", "endurance"]),
    reps: z.number().int().positive().optional(),
    workMinutes: z.number().positive().optional(),
    restMinutes: z.number().positive().optional(),
    workSeconds: z.number().positive().optional(),
    restSeconds: z.number().positive().optional(),
    totalMinutes: z.number().positive().optional(),
    lowPct: z.number().optional(),
    highPct: z.number().optional(),
    name: z.string().optional(),
    sport: z
        .enum(["Ride", "VirtualRide", "Run", "Swim"])
        .default("Ride"),
});
const getWellnessSchema = z.object({
    oldest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Start date YYYY-MM-DD"),
    newest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("End date YYYY-MM-DD"),
});
const listWorkoutsSchema = z.object({
    oldest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    newest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z
        .enum([
        "WORKOUT",
        "RACE_A",
        "RACE_B",
        "RACE_C",
        "NOTE",
        "HOLIDAY",
        "SICK",
        "INJURED",
        "TARGET",
    ])
        .optional(),
});
const getWorkoutSchema = z.object({
    eventId: z.number().int(),
});
const deleteWorkoutSchema = z.object({
    eventId: z.number().int(),
});
const updateWorkoutSchema = z.object({
    eventId: z.number().int(),
    name: z.string().optional(),
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    description: z.string().optional(),
});
/* ---------------------------------------------------------------------- */
/* Server                                                                  */
/* ---------------------------------------------------------------------- */
const server = new Server({ name: "intervals-icu-mcp", version: "0.1.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "intervals_get_profile",
            description: "Get the connected athlete's Intervals.icu profile (name, timezone, etc). Useful to confirm the API key works and identify the athlete.",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "intervals_get_sport_settings",
            description: "Get the athlete's sport settings, including current FTP, LTHR, and max HR. Use this before building workouts so power/HR targets are based on the athlete's real current numbers, not assumptions.",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "intervals_list_workouts",
            description: "List planned and/or completed calendar events between two dates. Defaults to all categories; pass category to filter to just WORKOUT, RACE_A, NOTE, etc.",
            inputSchema: {
                type: "object",
                properties: {
                    oldest: { type: "string", description: "YYYY-MM-DD" },
                    newest: { type: "string", description: "YYYY-MM-DD" },
                    category: {
                        type: "string",
                        enum: [
                            "WORKOUT",
                            "RACE_A",
                            "RACE_B",
                            "RACE_C",
                            "NOTE",
                            "HOLIDAY",
                            "SICK",
                            "INJURED",
                            "TARGET",
                        ],
                    },
                },
                required: ["oldest", "newest"],
            },
        },
        {
            name: "intervals_get_workout",
            description: "Get full detail for a single calendar event by its id.",
            inputSchema: {
                type: "object",
                properties: { eventId: { type: "number" } },
                required: ["eventId"],
            },
        },
        {
            name: "intervals_create_template_workout",
            description: "Create a planned workout on the calendar from a built-in template: threshold, vo2max, sprint, or endurance. This is the fast path for common sessions. Power targets are expressed as %FTP and will use the athlete's FTP set in Intervals.icu sport settings. Once created, the workout appears on the Intervals.icu calendar and syncs to Garmin Connect automatically if the athlete has linked their Garmin account in Intervals.icu settings.",
            inputSchema: {
                type: "object",
                properties: {
                    date: { type: "string", description: "YYYY-MM-DD" },
                    template: {
                        type: "string",
                        enum: ["threshold", "vo2max", "sprint", "endurance"],
                    },
                    reps: { type: "number", description: "Number of intervals (not used for endurance)" },
                    workMinutes: { type: "number", description: "Work interval length in minutes (threshold/vo2max)" },
                    restMinutes: { type: "number", description: "Recovery length in minutes (threshold/vo2max)" },
                    workSeconds: { type: "number", description: "Work interval length in seconds (sprint only)" },
                    restSeconds: { type: "number", description: "Recovery length in seconds (sprint only)" },
                    totalMinutes: { type: "number", description: "Total ride length in minutes (endurance only)" },
                    lowPct: { type: "number", description: "Override the lower %FTP bound" },
                    highPct: { type: "number", description: "Override the upper %FTP bound" },
                    name: { type: "string", description: "Custom workout name" },
                    sport: {
                        type: "string",
                        enum: ["Ride", "VirtualRide", "Run", "Swim"],
                    },
                },
                required: ["date", "template"],
            },
        },
        {
            name: "intervals_create_custom_workout",
            description: "Create a fully custom planned workout from an explicit list of steps and/or repeat blocks. Use this when the built-in templates don't fit (e.g. pyramid intervals, mixed-zone sessions, race-specific efforts). Each step needs a duration in seconds and a %FTP target range.",
            inputSchema: {
                type: "object",
                properties: {
                    date: { type: "string", description: "YYYY-MM-DD" },
                    name: { type: "string" },
                    sport: {
                        type: "string",
                        enum: ["Ride", "VirtualRide", "Run", "Swim", "WeightTraining", "Other"],
                    },
                    blocks: {
                        type: "array",
                        description: "Ordered steps/repeats. A step has duration (sec), targetLowPct, targetHighPct, optional label/cadence. A repeat has count and steps[].",
                        items: { type: "object" },
                    },
                    notes: { type: "string" },
                },
                required: ["date", "name", "blocks"],
            },
        },
        {
            name: "intervals_update_workout",
            description: "Update an existing planned workout's name, date, or description.",
            inputSchema: {
                type: "object",
                properties: {
                    eventId: { type: "number" },
                    name: { type: "string" },
                    date: { type: "string", description: "YYYY-MM-DD" },
                    description: { type: "string" },
                },
                required: ["eventId"],
            },
        },
        {
            name: "intervals_delete_workout",
            description: "Delete a planned workout from the calendar by its event id.",
            inputSchema: {
                type: "object",
                properties: { eventId: { type: "number" } },
                required: ["eventId"],
            },
        },
        {
            name: "intervals_get_wellness",
            description: "Get daily wellness data for a date range: resting HR, HRV, sleep score, sleep duration, TSB (form/freshness = CTL minus ATL), CTL (fitness), ATL (fatigue), and any manually entered mood/fatigue/motivation scores. Use this before prescribing any session to check objective readiness — call with oldest=today and newest=today for the current day's snapshot, or the last 7 days for trend context.",
            inputSchema: {
                type: "object",
                properties: {
                    oldest: { type: "string", description: "YYYY-MM-DD" },
                    newest: { type: "string", description: "YYYY-MM-DD" },
                },
                required: ["oldest", "newest"],
            },
        },
    ],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "intervals_get_profile": {
                const profile = await client.getProfile();
                return textResult(profile);
            }
            case "intervals_get_sport_settings": {
                const settings = await client.getSportSettings();
                return textResult(settings);
            }
            case "intervals_list_workouts": {
                const parsed = listWorkoutsSchema.parse(args);
                const events = await client.listEvents(parsed);
                return textResult(events);
            }
            case "intervals_get_workout": {
                const parsed = getWorkoutSchema.parse(args);
                const event = await client.getEvent(parsed.eventId);
                return textResult(event);
            }
            case "intervals_create_template_workout": {
                const parsed = createTemplateWorkoutSchema.parse(args);
                const blocks = buildTemplateBlocks(parsed);
                const description = renderWorkoutText(blocks);
                const seconds = totalDuration(blocks);
                const event = {
                    category: "WORKOUT",
                    start_date_local: toStartDateLocal(parsed.date),
                    name: parsed.name ?? defaultName(parsed.template, parsed),
                    type: parsed.sport,
                    description,
                    moving_time: seconds,
                };
                const created = await client.createEvent(event);
                return textResult({
                    created,
                    rendered_workout_text: description,
                    planned_duration_minutes: Math.round(seconds / 60),
                    note: "If Garmin Connect is linked in Intervals.icu settings, this workout will sync to the athlete's Garmin device automatically.",
                });
            }
            case "intervals_create_custom_workout": {
                const parsed = createCustomWorkoutSchema.parse(args);
                const blocks = parsed.blocks;
                let description = renderWorkoutText(blocks);
                if (parsed.notes) {
                    description += `\n\n${parsed.notes}`;
                }
                const seconds = totalDuration(blocks);
                const event = {
                    category: "WORKOUT",
                    start_date_local: toStartDateLocal(parsed.date),
                    name: parsed.name,
                    type: parsed.sport,
                    description,
                    moving_time: seconds,
                };
                const created = await client.createEvent(event);
                return textResult({
                    created,
                    rendered_workout_text: description,
                    planned_duration_minutes: Math.round(seconds / 60),
                    note: "If Garmin Connect is linked in Intervals.icu settings, this workout will sync to the athlete's Garmin device automatically.",
                });
            }
            case "intervals_update_workout": {
                const parsed = updateWorkoutSchema.parse(args);
                const patch = {};
                if (parsed.name)
                    patch.name = parsed.name;
                if (parsed.date)
                    patch.start_date_local = toStartDateLocal(parsed.date);
                if (parsed.description)
                    patch.description = parsed.description;
                const updated = await client.updateEvent(parsed.eventId, patch);
                return textResult(updated);
            }
            case "intervals_delete_workout": {
                const parsed = deleteWorkoutSchema.parse(args);
                await client.deleteEvent(parsed.eventId);
                return textResult({ deleted: true, eventId: parsed.eventId });
            }
            case "intervals_get_wellness": {
                const parsed = getWellnessSchema.parse(args);
                const wellness = await client.getWellness(parsed);
                return textResult(wellness);
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (err) {
        if (err instanceof IntervalsApiError) {
            return errorResult(`Intervals.icu API returned ${err.status}: ${err.body}`);
        }
        if (err instanceof z.ZodError) {
            return errorResult(`Invalid arguments: ${err.message}`);
        }
        return errorResult(err instanceof Error ? err.message : String(err));
    }
});
/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */
function textResult(data) {
    return {
        content: [
            {
                type: "text",
                text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
            },
        ],
    };
}
function errorResult(message) {
    return {
        content: [{ type: "text", text: message }],
        isError: true,
    };
}
function buildTemplateBlocks(parsed) {
    switch (parsed.template) {
        case "threshold":
            return thresholdSession({
                reps: parsed.reps ?? 3,
                workMinutes: parsed.workMinutes ?? 12,
                restMinutes: parsed.restMinutes ?? 4,
                lowPct: parsed.lowPct,
                highPct: parsed.highPct,
            });
        case "vo2max":
            return vo2maxSession({
                reps: parsed.reps ?? 5,
                workMinutes: parsed.workMinutes ?? 4,
                restMinutes: parsed.restMinutes ?? 4,
                lowPct: parsed.lowPct,
                highPct: parsed.highPct,
            });
        case "sprint":
            return sprintSession({
                reps: parsed.reps ?? 10,
                workSeconds: parsed.workSeconds ?? 15,
                restSeconds: parsed.restSeconds ?? 45,
                lowPct: parsed.lowPct,
                highPct: parsed.highPct,
            });
        case "endurance":
            return endurance({
                totalMinutes: parsed.totalMinutes ?? 90,
                lowPct: parsed.lowPct,
                highPct: parsed.highPct,
            });
    }
}
function defaultName(template, parsed) {
    switch (template) {
        case "threshold":
            return `Threshold ${parsed.reps ?? 3}x${parsed.workMinutes ?? 12}min`;
        case "vo2max":
            return `VO2max ${parsed.reps ?? 5}x${parsed.workMinutes ?? 4}min`;
        case "sprint":
            return `Sprints ${parsed.reps ?? 10}x${parsed.workSeconds ?? 15}s`;
        case "endurance":
            return `Endurance ${parsed.totalMinutes ?? 90}min`;
        default:
            return "Workout";
    }
}
/* ---------------------------------------------------------------------- */
/* Start                                                                   */
/* ---------------------------------------------------------------------- */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("intervals-icu-mcp server running on stdio");
}
main().catch((err) => {
    console.error("Fatal error starting server:", err);
    process.exit(1);
});

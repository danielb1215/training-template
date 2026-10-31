# MCP Tool Contracts: intervals-icu-mcp

These are the tools the MCP server exposes to Claude. All tools communicate over stdio. Inputs are JSON; outputs are JSON wrapped in a `content[].text` field.

---

## intervals_get_profile

**Purpose**: Confirm API key works and retrieve athlete identity.

**Input**: none

**Output**: `{ id, name, email, timezone, ... }`

**When Claude uses it**: At the start of any session where athlete identity is uncertain, or to verify connectivity.

---

## intervals_get_sport_settings

**Purpose**: Fetch current FTP, LTHR, max HR from Intervals.icu.

**Input**: none

**Output**: `{ sportSettings: [{ type, ftp, lthr, maxHR, ... }] }`

**When Claude uses it**: Before building any power or HR-based workout. Required — never assume FTP.

---

## intervals_list_workouts

**Purpose**: List calendar events in a date range.

**Input**:
```json
{
  "oldest": "YYYY-MM-DD",
  "newest": "YYYY-MM-DD",
  "category": "WORKOUT | RACE_A | RACE_B | RACE_C | NOTE | HOLIDAY | SICK | INJURED | TARGET"
}
```

**Output**: Array of calendar event objects.

**When Claude uses it**: Weekly planning (check what's already on calendar), compliance review (pull completed events), readiness check (see recent training load).

---

## intervals_get_workout

**Purpose**: Get full detail on a single event.

**Input**: `{ "eventId": integer }`

**Output**: Full event object including `description` (structured workout DSL).

**When Claude uses it**: Debugging a workout that didn't render correctly, or to check a specific session before modifying it.

---

## intervals_create_template_workout

**Purpose**: Fast-path workout creation from a named template.

**Input**:
```json
{
  "date": "YYYY-MM-DD",
  "template": "threshold | vo2max | sprint | endurance",
  "reps": integer,
  "workMinutes": number,
  "restMinutes": number,
  "workSeconds": number,
  "restSeconds": number,
  "totalMinutes": number,
  "lowPct": number,
  "highPct": number,
  "name": "string",
  "sport": "Ride | VirtualRide | Run | Swim"
}
```

**Output**: `{ created: {event}, rendered_workout_text: string, planned_duration_minutes: integer, note: string }`

**When Claude uses it**: Any standard session (threshold, VO2max, sprint, endurance). Preferred over custom when the template matches.

**Constraint**: `lowPct` and `highPct` must be based on current FTP from `intervals_get_sport_settings`, not hardcoded.

---

## intervals_create_custom_workout

**Purpose**: Fully custom workout from explicit steps/repeats.

**Input**:
```json
{
  "date": "YYYY-MM-DD",
  "name": "string",
  "sport": "Ride | VirtualRide | Run | Swim | WeightTraining | Other",
  "blocks": [
    {
      "duration": integer,
      "targetLowPct": number,
      "targetHighPct": number,
      "targetType": "FTP | LTHR | MaxHR",
      "label": "string",
      "cadence": integer
    }
  ],
  "notes": "string"
}
```

**Output**: Same as `intervals_create_template_workout`.

**When Claude uses it**: Pyramid intervals, mixed-zone sessions, race-specific efforts, or any workout the templates don't cover.

---

## intervals_update_workout

**Purpose**: Edit name, date, or description of a planned workout.

**Input**: `{ "eventId": integer, "name": string, "date": "YYYY-MM-DD", "description": string }`

**Output**: Updated event object.

**When Claude uses it**: Rescheduling a workout, correcting a mistake, updating targets after an FTP test.

---

## intervals_delete_workout

**Purpose**: Remove a planned workout from the calendar.

**Input**: `{ "eventId": integer }`

**Output**: `{ deleted: true, eventId: integer }`

**When Claude uses it**: Athlete cancels a session, plan restructuring, or duplicate workout created by mistake. Always confirm with athlete before deleting.

---

## Error Handling Contract

All tools return `{ content: [{ type: "text", text: "..." }], isError: true }` on failure. Claude must:
1. Report the error message clearly to the athlete
2. Offer to retry or suggest a manual fallback (e.g., "You can create this manually at intervals.icu")
3. Never silently swallow errors or proceed as if the workout was created

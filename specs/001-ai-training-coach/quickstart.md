# Quickstart Validation Guide: AI Training Coach

**Purpose**: Prove the system works end-to-end after setup.

---

## Prerequisites

- Node.js 18+ installed
- `uv` installed (for spec-kit CLI)
- Intervals.icu account with an API key (Settings → Developer Settings)
- Garmin Connect linked in Intervals.icu (Settings → Garmin) — optional but recommended

## Setup Steps

### 1. Build the MCP server

```bash
cd intervals-icu-mcp
npm install
npm run build
cd ..
```

### 2. Configure the API key

Create a `.env` file in `intervals-icu-mcp/` (never committed):

```
INTERVALS_API_KEY=your_key_here
INTERVALS_ATHLETE_ID=0
```

Or export directly in your shell:

```bash
export INTERVALS_API_KEY=your_key_here
```

### 3. Register the MCP server with Claude Code

Confirm `.mcp.json` at the repo root points to the built server:

```json
{
  "mcpServers": {
    "intervals-icu": {
      "command": "node",
      "args": ["./intervals-icu-mcp/dist/index.js"],
      "env": {
        "INTERVALS_API_KEY": "${INTERVALS_API_KEY}",
        "INTERVALS_ATHLETE_ID": "0"
      }
    }
  }
}
```

Restart Claude Code (or reload the MCP servers) after editing.

### 4. Fill in the athlete profile

Open `athlete/profile.md` and fill in your current FTP, LTHR, max HR, weight, available training days, and weekly hours budget. Minimum required: `ftp`.

### 5. Set a goal race

Open `athlete/goals.md` and add your next A race with its date and distance.

---

## Validation Scenarios

### Scenario A: API Connectivity

Ask Claude: `"Check my Intervals.icu profile"`

**Expected**: Claude calls `intervals_get_profile` and returns your athlete name and timezone. No errors.

---

### Scenario B: FTP Verification

Ask Claude: `"What are my current sport settings?"`

**Expected**: Claude calls `intervals_get_sport_settings` and returns your FTP, LTHR, and max HR. Verify these match what you have set in Intervals.icu.

---

### Scenario C: Workout Creation

Ask Claude: `"Create an endurance ride for tomorrow, 60 minutes"`

**Expected**:
1. Claude reads your FTP from profile or Intervals.icu
2. Creates a Z2 endurance workout at 56–75 % FTP
3. Returns confirmation with the workout name and duration
4. Workout appears on your Intervals.icu calendar within 30 seconds
5. If Garmin is linked, it syncs to your device within 5 minutes

---

### Scenario D: Readiness Check

Ask Claude: `"I slept poorly last night, I'm at a 2/5 for readiness. What should I do today?"`

**Expected**: Claude recognises the low readiness score and either suggests endurance/Z2 only or recommends rest — never prescribes a hard interval session.

---

### Scenario E: Weekly Plan

Ask Claude: `"Plan my training week"`

**Expected**:
1. Claude reads `plans/current-block.md` for the active phase
2. Reads `plans/current-week.md` or `athlete/profile.md` for available days
3. Proposes a day-by-day schedule matching the weekly hours budget
4. ≥80 % of planned time is Z1–Z2 (polarized distribution)
5. Asks for confirmation before creating any calendar events

---

### Scenario F: Load Guard

Add a note in `log/compliance.md` showing last week's TSS was 400.
Ask Claude: `"Plan this week's training"`

**Expected**: Claude targets ≤440 TSS for the current week (max 10 % increase) and calls out the constraint.

---

## What Success Looks Like

| Check | Pass Condition |
|-------|---------------|
| MCP server starts | `npm run inspector` shows tools listed, no errors |
| API key valid | `intervals_get_profile` returns athlete data |
| Workout created | Event appears on Intervals.icu calendar with structured steps |
| Garmin sync | Workout appears on Garmin Connect within 5 min (if linked) |
| Readiness respected | Low score → easy session prescribed |
| FTP-relative targets | No absolute watt values in workout descriptions |
| Load guard active | 10 % ramp rule respected in weekly planning |

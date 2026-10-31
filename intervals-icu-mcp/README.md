# intervals-icu-mcp

An MCP (Model Context Protocol) server that lets Claude create, list, update,
and delete planned workouts on [Intervals.icu](https://intervals.icu).

Workouts created through this server appear on your Intervals.icu calendar
as structured sessions (warmup, intervals, cooldown, with %FTP power
targets). If you've linked Garmin Connect inside Intervals.icu
(**Settings → Garmin**), those workouts sync to your Garmin device
automatically — no separate Garmin API integration needed.

```
Claude  →  this MCP server  →  Intervals.icu API  →  Garmin Connect  →  your watch/head unit
```

## Status

This was scaffolded and verified (builds clean, starts over stdio, tool
list responds correctly) but **has not been tested against a real
Intervals.icu account** — only against the public API docs. Treat the first
real run as a test: create one throwaway workout, confirm it looks right on
intervals.icu and syncs to Garmin, then trust it for daily use.

## What it can do

| Tool | Purpose |
|---|---|
| `intervals_get_profile` | Confirm the API key works, see athlete info |
| `intervals_get_sport_settings` | Read current FTP / LTHR / max HR — use this before building workouts so targets are accurate |
| `intervals_list_workouts` | List calendar events (planned or completed) in a date range |
| `intervals_get_workout` | Get full detail on one event by id |
| `intervals_create_template_workout` | Fast path: threshold, vo2max, sprint, or endurance session from a few parameters |
| `intervals_create_custom_workout` | Fully custom session built from steps/repeats |
| `intervals_update_workout` | Edit name, date, or description of a planned workout |
| `intervals_delete_workout` | Remove a planned workout |

## Setup

### 1. Get an Intervals.icu API key

1. Log in at [intervals.icu](https://intervals.icu)
2. Go to **Settings** → scroll to **Developer Settings**
3. Generate an API key and copy it

Your athlete ID is the number in your intervals.icu profile URL
(`intervals.icu/athlete/XXXXXX/...`), or just use `0` and the API will
auto-resolve to the key's owner.

### 2. Install and build

```bash
git clone <this-repo-url>
cd intervals-icu-mcp
npm install
npm run build
```

### 3. Configure Claude Desktop (or Claude Code)

Add to your MCP config (`claude_desktop_config.json` on Claude Desktop, or
the equivalent `.mcp.json` for Claude Code):

```json
{
  "mcpServers": {
    "intervals-icu": {
      "command": "node",
      "args": ["/absolute/path/to/intervals-icu-mcp/dist/index.js"],
      "env": {
        "INTERVALS_API_KEY": "your_api_key_here",
        "INTERVALS_ATHLETE_ID": "0"
      }
    }
  }
}
```

Restart Claude Desktop (or restart your Claude Code session) and the
`intervals_*` tools should be available.

### 4. Test it

Ask Claude something like:

> "Check my Intervals.icu FTP, then create a threshold workout for tomorrow:
> 3x12min at 88-95% FTP with 4min recovery."

Then check intervals.icu's calendar — the workout should appear with full
structured steps. If Garmin is linked, it'll show up on your watch as a
structured workout you can follow with live target alerts.

## Local development

```bash
npm run dev          # run with tsx, no build step
npm run build        # compile TypeScript to dist/
npm run inspector     # launch the MCP Inspector against the built server
```

## Architecture

- `src/intervalsClient.ts` — thin REST wrapper around the Intervals.icu API
  (basic auth, `GET/POST/PUT/DELETE` on `/athlete/{id}/events`)
- `src/workoutBuilder.ts` — converts structured step/repeat objects into the
  plain-text DSL Intervals.icu parses for workout steps (e.g.
  `- 3x` / `  - Threshold 12m 88-95% FTP`)
- `src/index.ts` — MCP server: tool definitions, input validation (zod),
  dispatch to the client

## Extending this

Ideas for a Claude Code session picking this up:

- **OAuth support** — currently uses a personal API key (simplest path for
  single-user use). For a multi-user or hosted version, switch to
  Intervals.icu's OAuth 2.0 flow.
- **Training plan generation** — a tool that takes a goal event date and
  generates a periodized block of workouts (base → build → peak → taper)
  in one call.
- **Wellness read tools** — `GET /athlete/{id}/wellness` for HRV, resting
  HR, sleep — useful for Claude to factor recovery into workout suggestions
  before creating them.
- **Activity analysis tools** — pull completed activities and compare
  planned vs. actual (compliance tracking).
- **Remote deployment** — wrap this in an HTTP/SSE transport instead of
  stdio if you want it usable from claude.ai directly (Custom Connectors)
  rather than only Claude Desktop/Code. The `@modelcontextprotocol/sdk`
  package supports both `StdioServerTransport` and HTTP-based transports;
  swapping `src/index.ts`'s transport is the main change needed.

## Reference

- [Intervals.icu API docs](https://intervals.icu/api-docs.html)
- [Intervals.icu API access guide](https://forum.intervals.icu/t/api-access-to-intervals-icu/609)
- [Uploading planned workouts guide](https://forum.intervals.icu/t/uploading-planned-workouts-to-intervals-icu/63624)
- [Model Context Protocol docs](https://modelcontextprotocol.io)

## License

MIT

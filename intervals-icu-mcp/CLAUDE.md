# Project context for Claude Code

This is an MCP server exposing Intervals.icu's planned-workout API as
tools. It was scaffolded by Claude (chat) and verified to build and start
correctly, but has **not been tested against a live Intervals.icu account**.

## First things to do in this session

1. Run `npm install && npm run build` to confirm the environment is clean.
2. Ask the user for their Intervals.icu API key (Settings → Developer
   Settings on intervals.icu) and set `INTERVALS_API_KEY` in the shell or a
   local `.env` you load — don't hardcode it anywhere that gets committed.
3. Run `npm run inspector` and call `intervals_get_profile` to confirm the
   key actually authenticates against the real API.
4. Call `intervals_get_sport_settings` and sanity-check the returned FTP
   against what the user told Claude in chat — these should match or the
   user should be told to update their FTP on intervals.icu first.
5. Create one real test workout via `intervals_create_template_workout`
   (a short one, e.g. 20min endurance) and have the user confirm in the
   intervals.icu UI that it rendered correctly and, if Garmin is linked,
   that it appeared as a structured workout on their Garmin Connect
   calendar.

## Known gaps / things likely to need fixing

- **Workout text DSL accuracy**: the format in `workoutBuilder.ts` is based
  on the publicly documented examples (see README references), but
  Intervals.icu's parser may be stricter or more lenient than assumed about
  whitespace, indentation, or duration formatting (e.g. whether `4m30s` vs
  `4:30` is accepted). If a created workout doesn't show structured steps
  on intervals.icu, fetch the event back with `intervals_get_workout` and
  compare the saved `description` against what a workout created through
  the intervals.icu web UI produces for the same session — replicate that
  format if it differs.
- **Bulk create endpoint**: `IntervalsClient.createEvents` assumes a
  `/events/bulk` endpoint accepting an array. This was not in the searched
  documentation excerpts — verify it exists before relying on it; if not,
  fall back to looping `createEvent` calls.
- **HR-relative targets**: `targetType: "LTHR"` and `"MaxHR"` are wired
  into the text rendering but not exercised by the templates (which are
  all FTP-based). If the user wants HR-based workouts (useful for runs or
  riders without a power meter), extend the templates or confirm the
  rendered text format Intervals.icu expects for HR zones.
- **No tests**: there's no test suite. If this grows past personal use,
  add unit tests for `workoutBuilder.ts` (pure functions, easy to test)
  and integration tests behind a flag that only run with a real API key
  present.

## Deployment options to discuss with the user

- **Local only (current default)**: stdio transport, runs as a child
  process of Claude Desktop or Claude Code. Simplest, no hosting needed,
  but only works on the machine it's installed on.
- **Remote/hosted**: if the user wants this available from claude.ai on
  any device (not just one desktop), it needs an HTTP-based MCP transport
  and a place to run it (e.g. a small VPS, Fly.io, Railway, Cloudflare
  Workers). This also opens the door to OAuth instead of a shared API key,
  which matters if more than one person will use the same deployment.
- Ask the user which of these they actually want before investing time in
  the remote path — most single-user training-tracker use cases are well
  served by the local stdio setup.

## Style notes

- Keep the zod schemas and the MCP `inputSchema` JSON in sync manually —
  there's no codegen between them currently. If adding a tool parameter,
  update both.
- The athlete-facing tool descriptions (in `index.ts`) are written for
  Claude to read and decide when to call the tool — keep them specific
  about what each tool does and when Garmin sync happens, since that's the
  detail most likely to matter to the user's actual question.

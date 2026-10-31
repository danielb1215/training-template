# First-Run Onboarding (Claude instructions)

Run this flow when **any** of these is true, before the Session Start Protocol in `CLAUDE.md`:

- `CLAUDE.md` still contains the text `{{ATHLETE_NAME}}`
- `intervals-icu-mcp/.env` does not exist **and** `INTERVALS_API_KEY` is not set in the environment
- The FTP row in `athlete/profile.md` is empty

The athlete's first message can be anything ("hola", "configura mi entrenador", "set me up"). Reply in the athlete's language. Goal: the athlete only gives their Intervals.icu API key and their personal data/goals — Claude does everything else.

Track progress so a later session can resume: steps already done are visible in the files (placeholders gone, `.env` present, profile filled).

---

## Step 1 — One message, everything you need

Greet briefly, explain this sets up their personal coach in ~5 minutes, then ask for all of this **in a single message** (numbered list, tell them they can answer in free text and skip what they don't know):

1. **Intervals.icu API key** — https://intervals.icu/settings → *Developer Settings* → *API Key* (generate). Intervals.icu must be connected to their Garmin/Wahoo/Strava. Tell them they can paste it here, or — if they prefer it never appears in the chat — create `intervals-icu-mcp/.env` with the line `INTERVALS_API_KEY=...` themselves and reply "listo".
2. **Name** they want to be called and **email**
3. **Sports** (primary / secondary) and **equipment**: which bikes, power meter or smart trainer yes/no, HR strap/watch
4. **Availability**: which days they can train, hours per week, preferred long day, preferred hard days, usual training time
5. **Goal / A-race**: name, date, type and distance/elevation; any B/C races; what success looks like (finish, time, placing, FTP/W/kg)
6. **Current fitness** if known (FTP, LTHR, max HR, weight) — say you'll read them from Intervals.icu anyway
7. **Injuries or restrictions**, home altitude, anything else (group rides, travel, work schedule)

Do not ask follow-ups one by one. If answers are missing, use sensible defaults and list them as assumptions at the end.

## Step 2 — Store the API key (never commit it)

If the key was pasted in chat:

1. Write `intervals-icu-mcp/.env`:
   ```
   INTERVALS_API_KEY=<key>
   INTERVALS_ATHLETE_ID=0
   ```
2. Confirm it is ignored: `git check-ignore intervals-icu-mcp/.env` must print the path. If not, stop and fix `.gitignore` first.
3. Never echo the key back, never put it in any other file, never `git add` it.

On claude.ai/code (cloud) a `.env` file disappears when the container is recycled. Still write it so this session works, and tell the athlete to also add `INTERVALS_API_KEY` as an environment variable in their cloud environment settings.

## Step 3 — Verify the key and read their numbers

Run:

```bash
node intervals-icu-mcp/check.mjs
```

- `ok: true` → use `athlete.name`, `athlete.timezone`, and `sportSettings[]` (`ftp`, `lthr`, `max_hr` per sport type; `Ride` types for cycling, `Run` types for running).
- `API_ERROR 401/403` → the key is wrong; ask them to copy it again. Do not continue to Step 6 without a working key (Steps 4–5 can proceed).
- `NO_KEY` → the `.env` wasn't created; ask again.

The first run of the MCP server installs its dependencies automatically (`intervals-icu-mcp/launch.mjs`). If Node.js is missing (`node: command not found`), tell them to install Node 18+ from https://nodejs.org and reopen.

Prefer the athlete's stated numbers when they conflict with Intervals.icu, but mention the difference. If FTP is unknown everywhere, mark it `TBD` and plan a ramp/20-min test in week 1 (`plans/ftp-development.md`).

## Step 4 — Personalise the placeholders

Time zone: the Intervals.icu `timezone` (IANA, e.g. `Europe/Madrid`), or what the athlete said. Then:

```bash
./setup.sh   # run with the four variables set inline, e.g. FULL="Ana María Pérez" FIRST="Ana" EMAIL="ana@example.com" TZONE="Europe/Madrid" ./setup.sh
```

If the permission prompt blocks the inline-variable form, export them first (`export FULL=... FIRST=... EMAIL=... TZONE=...`) and run `./setup.sh`.

On Windows without bash, do the same replacements with Edit across the repo: `{{ATHLETE_FULL_NAME}}`, `{{ATHLETE_NAME}}`, `{{ATHLETE_EMAIL}}`, `{{TIMEZONE}}`. Verify none remain: `grep -rn "{{ATHLETE_\|{{TIMEZONE}}" --exclude-dir=.git --exclude=setup.sh --exclude=ONBOARDING.md .` (ignore `.specify/`).

## Step 5 — Fill the athlete and plan files

Replace the `<!-- ... -->` placeholders with real content (keep table structure):

| File | Content |
|------|---------|
| `athlete/profile.md` | Metrics (source + date), sports, availability, equipment, power-data notes, injuries, time zone, altitude |
| `athlete/goals.md` | A-race and targets table (current vs target), secondary goals |
| `plans/a-race.md` | Event details they gave; leave unknown rows as `TBD` |
| `plans/macro.md` | Season plan working **backwards from the A-race date**: Base → Build → Peak → Taper (`CLAUDE.md` §10–11). Weeks per phase scaled to the time available; deload every 3rd–4th week; weekly hours from their availability |
| `plans/current-block.md` | The block that contains today |
| `plans/current-week.md` | This week (Monday-dated), sessions on available days only, following the phase template and the 80/20 rule |
| `log/compliance.md` | Leave the table empty (no history yet) |

If the A-race is less than ~8 weeks away, compress (short Build → Peak → Taper) and say so. If there is no race, plan a 12-week Base → Build block towards an FTP test.

## Step 6 — Connect the workout tools

The `intervals-icu` MCP tools only load when Claude Code starts. If they are not available in this session (no `intervals_*` tools), tell the athlete:

> Listo. Cierra y vuelve a abrir Claude Code en esta carpeta (o escribe `/mcp` → *intervals-icu* → *Reconnect*). Si te pregunta si apruebas el servidor `intervals-icu` del proyecto, acepta.

After reconnecting, call `intervals_get_profile` to confirm.

## Step 7 — Wrap up

1. Summary: what was set up, the season arc in 3–4 lines, this week's sessions, and the assumptions you made.
2. Commit the personalised files (`git add -A && git commit -m "Personalise coach for <name>"`), after checking `git status` does **not** list `intervals-icu-mcp/.env`. Ask before pushing.
3. Offer: "¿Creo los entrenamientos de esta semana en Intervals.icu?" → then follow the normal Workout Creation Flow in `CLAUDE.md` §8 (calendar check, readiness check for Z4+, confirmation).

From the next conversation on, onboarding is done and the normal Session Start Protocol applies.

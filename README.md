# Training — AI Coaching Repo

A personal endurance training coach powered by Claude Code + Intervals.icu. Claude reads your athlete profile, training plan and workout library, then creates structured workouts directly on your Intervals.icu calendar (which auto-syncs to Garmin / Wahoo).

## Quick start — one prompt

### You need

- [Claude Code](https://code.claude.com) (desktop app, CLI or claude.ai/code)
- [Node.js 18+](https://nodejs.org)
- A free [Intervals.icu](https://intervals.icu) account connected to Garmin / Wahoo / Strava

### Steps

1. On GitHub click **Use this template → Create a new repository** (make it **private** — it will hold your training data), then open it in Claude Code (or clone it and run `claude` in the folder).
2. Type:

   > **Configura mi entrenador** *(or "Set up my coach")*

3. Claude asks for your **Intervals.icu API key** (intervals.icu/settings → Developer Settings) and your **data and goals** — answer in one message.
4. Claude verifies the key, reads your FTP/LTHR/max HR from Intervals.icu, fills in every file, builds your season plan and this week, and installs the workout server.
5. Restart Claude Code once (or `/mcp` → *intervals-icu* → *Reconnect*) so the workout tools load. Then: *"Crea los entrenamientos de esta semana"*.

Your key is stored only in `intervals-icu-mcp/.env`, which git ignores — it never goes to GitHub.

**claude.ai/code (cloud)**: also add `INTERVALS_API_KEY` as an environment variable in your environment settings — files that aren't committed (like `.env`) are lost when the cloud container is recycled.

### Day to day

- "¿Qué me toca hoy?" / "What should I do today?"
- "Planea mi semana"
- "Crea un entrenamiento de umbral para el jueves"
- "Analiza la salida de ayer"
- "¿Cómo me fue la semana pasada?"

<details>
<summary>Manual setup (without the onboarding prompt)</summary>

```bash
./setup.sh                                   # name, email, time zone
echo "INTERVALS_API_KEY=your_key" > intervals-icu-mcp/.env
node intervals-icu-mcp/check.mjs             # verifies the key, shows FTP/LTHR/max HR
```

Then fill `athlete/profile.md`, `athlete/goals.md`, `plans/a-race.md` and `plans/macro.md`. Dependencies install automatically the first time Claude Code starts the server (`intervals-icu-mcp/launch.mjs`).
</details>

---

## Folder structure

```
├── CLAUDE.md                ← Coach brain — Claude's master instructions
├── ONBOARDING.md            ← First-run setup flow Claude follows
├── .mcp.json                ← MCP server config (key read from intervals-icu-mcp/.env)
├── .claude/settings.json    ← Injects your local time with every message
├── athlete/                 ← YOUR profile, goals, readiness log, fuelling
├── plans/                   ← Season (macro), block, week, A-race
├── workouts/                ← Session library: cycling, running, strength
├── log/                     ← Monthly logs + weekly compliance (load guard)
├── analysis/                ← Readiness, weekly review, ride analysis, load rules
├── specs/                   ← How the system was designed
└── intervals-icu-mcp/       ← MCP server (TypeScript)
```

## Key design principles

- **No hardcoded watts** — all intensities are %FTP or %LTHR
- **80/20 polarized** by default — change it in `plans/macro.md`
- **10 % load rule** — week-over-week TSS increase capped at 10 %
- **Readiness first** — wellness data checked before any hard session
- **Single source of truth** — FTP read from `athlete/profile.md` or Intervals.icu

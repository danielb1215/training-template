# Training — AI Coaching Repo

A personal endurance training coach powered by Claude Code + Intervals.icu. Claude reads your athlete profile, training plan and workout library, then creates structured workouts directly on your Intervals.icu calendar (which auto-syncs to Garmin / Wahoo).

## Quick start (≈ 15 min)

### 0. Requirements

- [Claude Code](https://code.claude.com) (CLI, desktop app or claude.ai/code)
- Node.js 18+
- A free [Intervals.icu](https://intervals.icu) account connected to Garmin/Strava

### 1. Personalise the repo

```bash
./setup.sh
```

It asks for your name, email and time zone and fills them in across `CLAUDE.md` and the other files. Run it once, then commit.

### 2. Build the MCP server

```bash
cd intervals-icu-mcp && npm install && npm run build && cd ..
```

### 3. Add your Intervals.icu API key

Generate it at https://intervals.icu/settings → Developer Settings. `.mcp.json` reads it from an environment variable, so **the key never goes into git**:

```bash
export INTERVALS_API_KEY=your_key_here
```

Add that line to your `~/.zshrc` / `~/.bashrc`. On claude.ai/code (cloud), set it as an environment variable of the environment instead.

### 4. Fill in your athlete files

Open these and replace the `<!-- ... -->` placeholders (or just tell Claude your numbers and let it fill them):

1. `athlete/profile.md` — FTP, LTHR, max HR, available days, weekly hours
2. `athlete/goals.md` — your A-race and targets
3. `plans/a-race.md` — event details
4. `plans/macro.md` — or ask Claude: *"Build my season plan towards my A-race"*

### 5. Start coaching

Open Claude Code in this folder and say:

- "What should I do today?"
- "Plan my training week"
- "Create a threshold workout for Thursday"
- "Analyse yesterday's ride"
- "How was my training last week?"

---

## Folder structure

```
├── CLAUDE.md                ← Coach brain — Claude's master instructions
├── .mcp.json                ← MCP server config (API key from env var)
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

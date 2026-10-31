# Implementation Plan: AI Training Coach

**Branch**: `claude/install-spec-kit-training-egh5eu` | **Date**: 2026-06-30 | **Spec**: [spec.md](./spec.md)

## Summary

Build a single GitHub repository that serves as an intelligent, AI-powered endurance training coach. The core is a TypeScript MCP server exposing Intervals.icu's workout API to Claude, wrapped in a structured folder system of Markdown files (athlete profile, periodized plan, workout library, training log) and a master `CLAUDE.md` that teaches Claude how to behave as a coach. Claude reads context from local files, reasons about periodization and readiness, and pushes structured workouts to Intervals.icu (which syncs to Garmin automatically).

## Technical Context

**Language/Version**: TypeScript (MCP server, Node 18+), Markdown (all data/config files)

**Primary Dependencies**: `@modelcontextprotocol/sdk`, `zod`, `tsx` — all already defined in the scaffolded `intervals-icu-mcp/package.json`

**Storage**: Plain Markdown/JSON files in the repository; no database

**Testing**: Manual integration testing via `npm run inspector` against live Intervals.icu account (no automated test suite in v1)

**Target Platform**: Local machine (Claude Desktop / Claude Code, stdio MCP transport)

**Project Type**: AI coaching system — MCP server + structured knowledge base

**Performance Goals**: Workout creation round-trip < 5 s; weekly plan generation < 3 minutes of conversation

**Constraints**: Single-athlete, local-only, no secrets committed to git, all intensity targets expressed as %FTP or %LTHR (never absolute watts)

**Scale/Scope**: One athlete, one machine, ~10–20 conversations/week

## Constitution Check

Constitution file is a blank template — no established project principles yet. All design decisions default to the spec's stated constraints:

- ✅ No secrets in repo (API key via env var only)
- ✅ Absolute watt values never stored — %FTP/%LTHR everywhere
- ✅ Single responsibility: MCP server only creates/reads Intervals.icu events; coaching logic lives in CLAUDE.md and Markdown context files
- ✅ Progressive overload and 80/20 polarization enforced through CLAUDE.md instructions
- ✅ Athlete profile is the single source of truth for FTP; never assume a value

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-training-coach/
├── plan.md              ← this file
├── research.md          ← Phase 0
├── data-model.md        ← Phase 1
├── quickstart.md        ← Phase 1
├── contracts/           ← Phase 1
│   └── mcp-tools.md
└── tasks.md             ← Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
Training/
│
├── CLAUDE.md                          # Master coaching instructions for Claude
├── .mcp.json                          # MCP server config (points to intervals-icu-mcp)
├── .gitignore                         # node_modules, dist/, .env, secrets
│
├── intervals-icu-mcp/                 # MCP server (TypeScript)
│   ├── src/
│   │   ├── index.ts                   # Tool definitions + request handler
│   │   ├── intervalsClient.ts         # REST wrapper for Intervals.icu API
│   │   └── workoutBuilder.ts          # Plain-text DSL renderer
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── athlete/                           # Athlete profile & readiness
│   ├── profile.md                     # FTP, LTHR, max HR, weight, sports, availability
│   ├── goals.md                       # A/B/C races with dates, long-term objectives
│   └── readiness-log.md               # Rolling 30-day HRV/sleep/fatigue entries
│
├── plans/                             # Periodization
│   ├── macro.md                       # Full season plan: blocks, dates, target race
│   ├── current-block.md               # Active mesocycle: phase, week N of M, TSS targets
│   └── current-week.md                # Active microcycle: day-by-day session plan
│
├── workouts/                          # Workout template library
│   ├── README.md                      # How to read templates; intensity scale reference
│   ├── cycling/
│   │   ├── endurance.md               # Z1-Z2 long rides, recovery rides
│   │   ├── tempo.md                   # Z3 tempo / sweet-spot
│   │   ├── threshold.md               # Z4 FTP intervals
│   │   ├── vo2max.md                  # Z5 VO2max repeats
│   │   ├── anaerobic.md               # Z6 short hard efforts
│   │   └── sprint.md                  # Z7 neuromuscular / sprint power
│   └── running/
│       ├── easy.md                    # Easy aerobic runs
│       ├── tempo.md                   # Tempo / threshold runs (%LTHR)
│       └── intervals.md               # Track / hill repeats
│
├── log/                               # Training log
│   ├── 2026-06.md                     # Monthly session log (current month)
│   └── compliance.md                  # Planned vs actual by week
│
├── analysis/                          # Coaching analysis prompts
│   ├── weekly-review.md               # Prompt template: review last 7 days
│   ├── readiness-check.md             # Prompt: assess today's readiness
│   └── load-progression.md            # TSS ramp rate reference & tracking
│
└── specs/                             # Spec-kit artifacts
    └── 001-ai-training-coach/
        ├── spec.md
        ├── plan.md
        ├── research.md
        ├── data-model.md
        ├── quickstart.md
        └── contracts/
```

**Structure Decision**: Single flat repository. No monorepo tooling needed — the MCP server is the only compiled artifact; everything else is Markdown read by Claude at runtime.

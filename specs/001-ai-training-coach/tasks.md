# Tasks: AI Training Coach

**Input**: Design documents from `specs/001-ai-training-coach/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/mcp-tools.md ✅ quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repository skeleton, MCP server build, secrets wiring

- [ ] T001 Copy `intervals-icu-mcp/` source files from scaffolded zip into repo root at `intervals-icu-mcp/`
- [ ] T002 Run `npm install && npm run build` in `intervals-icu-mcp/` and confirm zero errors
- [ ] T003 Create `.gitignore` at repo root (node_modules, dist/, .env, *.local, .DS_Store)
- [ ] T004 [P] Create `.mcp.json` at repo root wiring `intervals-icu` MCP server to `./intervals-icu-mcp/dist/index.js` with `INTERVALS_API_KEY` and `INTERVALS_ATHLETE_ID` env vars
- [ ] T005 [P] Create `intervals-icu-mcp/.env.example` documenting required env vars (no actual values)

**Checkpoint**: `npm run inspector` starts, lists all 8 tools, exits cleanly.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Markdown knowledge base and CLAUDE.md coaching brain — must exist before any user story can be verified.

- [ ] T006 Create `athlete/profile.md` with all AthleteProfile fields from data-model.md as labelled blank fields ready to fill in (FTP, LTHR, max HR, weight, sports, available days, weekly hours, injury notes, updated)
- [ ] T007 [P] Create `athlete/goals.md` with GoalRace fields (race name, date, priority A/B/C, distance, sport, notes) and one placeholder example row
- [ ] T008 [P] Create `athlete/readiness-log.md` with ReadinessLog header row and scoring formula note; include last 7 days as blank entries
- [ ] T009 Create `plans/macro.md` with MacroPlan fields (target race, race date, plan start, blocks table, current block pointer, notes) — blank, ready to fill
- [ ] T010 [P] Create `plans/current-block.md` with CurrentBlock fields (phase, block start/end, week number, total weeks, weekly TSS target, intensity distribution, key sessions list) — blank
- [ ] T011 [P] Create `plans/current-week.md` with CurrentWeek fields (week_of, 7-row planned_sessions table with day/type/duration/TSS/status columns, total TSS planned/actual, notes) — blank
- [ ] T012 Create `log/compliance.md` with ComplianceTracker table header (week_of, sessions planned, completed, skipped, TSS planned, TSS actual, compliance %, load change %, notes) and a blank starter row
- [ ] T013 [P] Create `log/2026-06.md` as the first monthly training log with TrainingLogEntry header row (date, sport, planned type, actual type, duration min, TSS actual, compliance, notes)
- [ ] T014 Create `workouts/README.md` explaining the 7-zone Coggan power model and 5-zone HR model from research.md, with the zone tables (cycling %FTP, running %LTHR) and instructions for how Claude reads templates
- [ ] T015 [P] Create `workouts/cycling/endurance.md` — 4 endurance templates: Recovery Spin 30 min Z1, Easy Endurance 60 min Z2, Aerobic Base 90 min Z2, Long Ride 2h30 Z2; each with structure, %FTP targets, TSS estimate, when_to_use, scaling_notes
- [ ] T016 [P] Create `workouts/cycling/tempo.md` — 3 templates: Tempo 2×20 min Z3 (76–87 % FTP), Sweet Spot 3×15 min (88–93 % FTP), Sweet Spot Long 2×30 min; with full fields
- [ ] T017 [P] Create `workouts/cycling/threshold.md` — 4 templates: Threshold 3×10 min, Threshold 3×12 min, Threshold 2×20 min, Over-Under 3×12 min (alternating 95–105 % FTP); with full fields
- [ ] T018 [P] Create `workouts/cycling/vo2max.md` — 3 templates: VO2max 5×4 min (106–120 % FTP), VO2max 8×3 min, Micro-intervals 10×40s/20s; with full fields
- [ ] T019 [P] Create `workouts/cycling/anaerobic.md` — 2 templates: Anaerobic 6×1 min (130–150 % FTP), Tabata 8×20s/10s; with full fields
- [ ] T020 [P] Create `workouts/cycling/sprint.md` — 2 templates: Standing Sprints 8×15s (>150 % FTP), Seated Sprints 10×10s; with full fields
- [ ] T021 [P] Create `workouts/running/easy.md` — 3 templates: Easy Recovery Run 30 min Z1, Aerobic Base Run 45 min Z2, Long Easy Run 75 min Z2; with %LTHR targets
- [ ] T022 [P] Create `workouts/running/tempo.md` — 2 templates: Tempo Run 2×15 min (93–99 % LTHR), Cruise Intervals 4×8 min; with full fields
- [ ] T023 [P] Create `workouts/running/intervals.md` — 2 templates: Track Intervals 6×800 m (100–106 % LTHR), Hill Repeats 8×90 s; with full fields
- [ ] T024 Create `analysis/weekly-review.md` — a structured prompt template Claude uses to run a weekly review: pulls last 7 days from Intervals.icu, compares to current-week.md plan, computes compliance %, flags load spikes (>10 % TSS), identifies monotony (3+ hard days), and writes summary to log/compliance.md
- [ ] T025 [P] Create `analysis/readiness-check.md` — prompt template: ask athlete 3 questions (sleep quality 1–5, fatigue 1–5, motivation 1–5), compute readiness score, map to prescription tier (5=full session, 4=full, 3=reduce 10 %, 2=Z2 only, 1=rest), output recommendation
- [ ] T026 [P] Create `analysis/load-progression.md` — reference sheet: 10 % weekly TSS ramp rule, CTL/ATL/TSB explanation, how to read Intervals.icu fitness chart, warning signs of over-training; used by Claude during weekly planning
- [ ] T027 Create `CLAUDE.md` — the master coaching instruction file (see detailed spec in T027 note below)

> **T027 CLAUDE.md content spec**: Must include all of the following sections:
> 1. **Role & Identity** — Claude is the athlete's personal endurance coach; the athlete is {{ATHLETE_EMAIL}}
> 2. **Session Start Protocol** — on every session: read `athlete/profile.md`, read `plans/current-block.md`, read `plans/current-week.md`, note today's date and day of week
> 3. **Readiness Check** — before prescribing any Z4+ session, run the readiness check from `analysis/readiness-check.md`; if score ≤ 2, prescribe Z1-Z2 only
> 4. **FTP Rule** — ALWAYS call `intervals_get_sport_settings` or read `athlete/profile.md` for FTP before building any power workout; NEVER hardcode watt values
> 5. **Polarized Default** — 80/20 rule: ≥80 % of weekly training time in Z1–Z2, ≤20 % in Z4+; only one hard session per day; no back-to-back hard days without explicit athlete override
> 6. **Rest Day Respect** — never schedule or suggest workouts on days marked unavailable in `athlete/profile.md` without asking first
> 7. **Calendar Check** — before creating any workout, call `intervals_list_workouts` for the target week to see what's already planned
> 8. **Proactive Coaching** — if the athlete doesn't ask what to do, Claude should proactively suggest: "Based on your current plan (Build Block, Week 2), today is a threshold day. Want me to create the workout?"
> 9. **Workout Creation Flow** — propose session → athlete confirms → call MCP tool → confirm calendar event created → remind about Garmin sync
> 10. **Error Handling** — if MCP tool fails, report error clearly, offer to retry, never pretend workout was created
> 11. **Load Guard** — when planning a week, compute last week's TSS from log/compliance.md, cap new week at +10 % unless athlete explicitly accepts more
> 12. **Weekly Plan Template** — structure for a polarized week by phase (Base: Mon rest, Tue Z2, Wed threshold, Thu Z2, Fri rest, Sat long Z2, Sun recovery; Build: add VO2max Tue; Peak: sharpen; Taper: cut volume 40 %)
> 13. **Periodization Phase Guide** — what each block means and typical sessions per phase
> 14. **File Map** — list of all key files and what Claude reads from each

**Checkpoint**: All knowledge base files exist. CLAUDE.md is comprehensive. MCP server builds. Ready for user story validation.

---

## Phase 3: User Story 1 — Daily Workout Suggestion (Priority: P1) 🎯 MVP

**Goal**: Athlete asks "what should I do today?" and Claude proposes a correctly-zoned, FTP-scaled session, then creates it on Intervals.icu.

**Independent Test**: Ask "What should I do today?" — verify Claude reads profile + current block, suggests the right session type for the day, calls `intervals_get_sport_settings`, proposes a workout with %FTP targets, confirms with athlete, creates it via MCP, and confirms the calendar event.

### Implementation for User Story 1

- [ ] T028 [US1] Validate MCP connectivity: open Claude Code in this repo, ask "Check my Intervals.icu profile", confirm `intervals_get_profile` returns athlete data (Validation Scenario A from quickstart.md)
- [ ] T029 [US1] Fill in `athlete/profile.md` with real athlete data: FTP from `intervals_get_sport_settings`, LTHR, max HR, weight, available days (Scenario B)
- [ ] T030 [US1] Fill in `plans/current-block.md` to reflect current training phase (if no formal plan exists, set phase=Base, week 1 of 6)
- [ ] T031 [US1] Fill in `plans/current-week.md` with this week's day-by-day plan based on current block phase and available days
- [ ] T032 [US1] Test Scenario C: ask Claude to create a 60-min endurance ride for tomorrow; verify it appears on Intervals.icu calendar with structured Z2 steps and no hardcoded watts
- [ ] T033 [US1] Test readiness downscale (Scenario D): tell Claude readiness is 2/5, confirm it prescribes Z2 only or rest, not a hard session
- [ ] T034 [US1] Test rest-day guard: ask for a workout on a day marked unavailable in profile.md, confirm Claude flags conflict rather than creating

**Checkpoint**: User Story 1 fully functional — daily workout suggestion works end-to-end.

---

## Phase 4: User Story 2 — Weekly Plan Overview (Priority: P1)

**Goal**: Athlete asks "plan my training week" and Claude returns a polarized 7-day schedule and optionally bulk-creates all sessions.

**Independent Test**: Ask "Plan my training week" — verify Claude reads current block phase, respects available days and weekly hours, produces ≥80 % Z1–Z2 distribution, checks existing calendar events, and creates all sessions on confirmation.

### Implementation for User Story 2

- [ ] T035 [US2] Test Scenario E (quickstart.md): ask "Plan my training week" with current-block.md set to Base; verify 5-day schedule with correct polarized distribution
- [ ] T036 [US2] Fill `athlete/goals.md` with next A race date and distance; verify Claude references it when suggesting block structure
- [ ] T037 [US2] Fill `plans/macro.md` with full season plan: Base (6 wk), Build (6 wk), Peak (3 wk), Taper (1 wk), ending on goal race date
- [ ] T038 [US2] Test load guard (Scenario F): set last week's TSS in `log/compliance.md` to 400; ask for this week's plan; verify Claude caps at ≤440 TSS and calls it out
- [ ] T039 [US2] Test bulk creation: after Claude proposes the week, say "create all of them"; verify all sessions appear on Intervals.icu with correct dates and structure
- [ ] T040 [US2] Test existing-calendar check: manually create one workout in Intervals.icu for the week; ask for the week plan; verify Claude lists the existing workout and only fills remaining days

**Checkpoint**: Weekly planning works, load guard active, bulk creation functional.

---

## Phase 5: User Story 3 — Athlete Profile & Goals Setup (Priority: P2)

**Goal**: Athlete can set up or update profile and goals through natural language; changes persist to Markdown files.

**Independent Test**: Say "Update my FTP to 295 W" — verify `athlete/profile.md` is updated and Claude acknowledges; say "Add an A race on 2026-10-05: Granfondo X" — verify `athlete/goals.md` is updated and macro plan is adjusted.

### Implementation for User Story 3

- [ ] T041 [US3] Test profile update: tell Claude "my FTP is now 295"; verify Claude edits `athlete/profile.md` FTP field and offers to update any upcoming workout targets
- [ ] T042 [US3] Test goal race creation: tell Claude "Add an A race: Tour de los Andes, 2026-10-05, 180 km cycling"; verify `athlete/goals.md` is updated
- [ ] T043 [US3] Test macro plan generation: with A race in goals.md, ask "build my macro plan"; verify Claude proposes a 4-block plan in `plans/macro.md` with correct end date
- [ ] T044 [US3] Test injury handling: tell Claude "I have a knee issue, no running this week"; verify `athlete/profile.md` injury_notes is updated and Claude adjusts suggestions
- [ ] T045 [US3] Test availability change: tell Claude "I can't train on Wednesdays anymore"; verify profile.md available_days is updated

**Checkpoint**: Profile and goals management works via conversation.

---

## Phase 6: User Story 4 — Training Load & Compliance Review (Priority: P2)

**Goal**: Athlete asks for last week's review and Claude pulls completed sessions from Intervals.icu, computes compliance, flags issues.

**Independent Test**: Ask "How was my training last week?" — verify Claude calls `intervals_list_workouts` for last 7 days, compares to current-week.md plan, returns compliance %, and flags any load spikes or monotony.

### Implementation for User Story 4

- [ ] T046 [US4] Complete a few workouts on Intervals.icu (real or manually marked complete); ask "How was my training last week?"; verify compliance calculation
- [ ] T047 [US4] Test monotony detection: log 3 consecutive hard days in Intervals.icu; run weekly review; verify Claude flags monotony risk
- [ ] T048 [US4] Test load spike warning: set current week TSS 15 % above last week in compliance.md; verify Claude flags the spike
- [ ] T049 [US4] Test compliance logging: after Claude's weekly review, verify it updates `log/compliance.md` with the week's row
- [ ] T050 [US4] Test monthly log: verify completed sessions are reflected in `log/2026-06.md` (or current month)

**Checkpoint**: Retrospective analysis and compliance tracking working.

---

## Phase 7: User Story 5 — Custom Workout Creation (Priority: P3)

**Goal**: Athlete describes a non-standard workout in plain language; Claude translates it to structured steps and creates it.

**Independent Test**: Say "Create a sweet-spot workout for Thursday: 3×20 min at 88–93 % FTP, 5 min recovery" — verify Claude creates a custom workout via `intervals_create_custom_workout` with correct structured steps.

### Implementation for User Story 5

- [ ] T051 [US5] Test custom workout parsing: say "3×20 min sweet spot, 5 min recovery, for Thursday"; verify Claude translates to correct blocks (warmup + 3 repeats + cooldown) and calls `intervals_create_custom_workout`
- [ ] T052 [US5] Test implausibility guard: say "Create a 60-min workout at 120 % FTP"; verify Claude flags this as physiologically impossible and suggests a realistic alternative
- [ ] T053 [US5] Test missing-date handling: request a workout without specifying a day; verify Claude asks which day before creating
- [ ] T054 [US5] Test running custom workout: say "Hill repeats for Saturday: 8×90 seconds hard, 90s jog recovery"; verify Claude uses LTHR-based targets for running

**Checkpoint**: Custom workout creation works for any valid session description.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final wiring, documentation, and edge-case hardening

- [ ] T055 [P] Add `README.md` at repo root: project overview, quick setup steps (npm install, .env, .mcp.json), link to quickstart.md validation guide
- [ ] T056 [P] Run all 6 quickstart.md validation scenarios end-to-end; document results in a `quickstart-results.md` or inline notes
- [ ] T057 Commit and push all files to `claude/install-spec-kit-training-egh5eu` with a descriptive commit message
- [ ] T058 [P] Review CLAUDE.md for completeness: confirm all 14 sections from T027 spec are present and accurate
- [ ] T059 [P] Verify `.gitignore` covers `.env`, `dist/`, `node_modules/`, `*.local`, `.DS_Store`
- [ ] T060 Verify no hardcoded watt values appear anywhere in workout templates or CLAUDE.md (all intensities must be %FTP or %LTHR)

**Final Checkpoint**: All quickstart scenarios pass. CLAUDE.md is the complete coaching brain. Repo is clean and pushed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (MCP server must build first) — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — MVP delivery point
- **Phase 4 (US2)**: Depends on Phase 2 — can run in parallel with Phase 3
- **Phase 5 (US3)**: Depends on Phase 2 — can run in parallel with Phases 3 & 4
- **Phase 6 (US4)**: Depends on Phase 3 being complete (needs completed sessions)
- **Phase 7 (US5)**: Depends on Phase 2 — can run in parallel with Phase 3
- **Phase 8 (Polish)**: Depends on all desired user stories being complete

### Parallel Opportunities

Within Phase 2, all T007–T026 tasks marked [P] can run in parallel — they are different files with no inter-dependencies. T006 (profile.md) and T027 (CLAUDE.md) are sequential anchors.

Within Phase 1, T004 and T005 can run in parallel after T001–T002 complete.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T027) — this is the largest phase
3. Complete Phase 3: User Story 1 (T028–T034)
4. **STOP AND VALIDATE**: Daily workout suggestion works end-to-end
5. This is already a fully usable AI training coach

### Incremental Delivery

1. MVP: Phase 1 + 2 + 3 → Daily coaching works
2. Add Phase 4 → Weekly planning works
3. Add Phase 5 → Profile management works
4. Add Phase 6 → Retrospective analysis works
5. Add Phase 7 → Custom workouts work
6. Phase 8: Polish and ship

---

## Notes

- [P] tasks = different files, no shared dependencies
- All intensity values MUST be %FTP or %LTHR — never absolute watts
- CLAUDE.md (T027) is the most critical single file in the entire system
- The MCP server code is pre-built (from the zip); no new TypeScript needed unless extending tools
- "Implementation" for this project means writing Markdown files and validating Claude behaviour — not writing application code

# Feature Specification: AI Training Coach

**Feature Branch**: `001-ai-training-coach`

**Created**: 2026-06-30

**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Daily Workout Suggestion (Priority: P1)

The athlete opens a conversation with Claude and asks what they should do today. Claude reads the current training phase, the athlete's weekly availability, recent training load, and any readiness signals, then proposes a specific session with power/HR targets appropriate for the phase. If the athlete agrees, Claude creates the workout on Intervals.icu so it syncs to their Garmin device.

**Why this priority**: This is the core daily interaction that delivers the most immediate value. Every other capability supports this moment.

**Independent Test**: Can be fully tested by asking "What should I do today?" and confirming Claude reads the athlete profile, suggests a correctly-zoned session, and writes it to the calendar.

**Acceptance Scenarios**:

1. **Given** the athlete is in a build block, week 2 of 4, with threshold day scheduled, **When** they ask "what should I do today?", **Then** Claude suggests a threshold workout scaled to current FTP, confirms with the athlete, and creates it on Intervals.icu with correct structured steps.
2. **Given** the athlete logged poor sleep and elevated resting HR this morning, **When** they ask for a workout, **Then** Claude detects the readiness flags and downscales the session to endurance or proposes rest.
3. **Given** the athlete's availability says no training on Mondays, **When** asked on a Monday, **Then** Claude confirms it is a rest day and does not create a workout.

---

### User Story 2 — Weekly Plan Overview (Priority: P1)

The athlete asks Claude to lay out the week ahead. Claude reads the current training block, remaining weekly hours budget, and past compliance, then proposes a structured week (key sessions + easy days + rest) and optionally bulk-creates all planned workouts on the calendar.

**Why this priority**: Weekly planning is the second most frequent interaction and prevents ad-hoc, unstructured training.

**Independent Test**: Ask "Plan my training week" and verify Claude produces a day-by-day schedule that respects available days, TSS budget, and the current periodization phase.

**Acceptance Scenarios**:

1. **Given** the athlete has 8 available hours this week across 5 days, in a base phase, **When** they ask for the week plan, **Then** Claude returns a 5-day schedule with 80 % of TSS below threshold (80/20 polarized), spread across the available days.
2. **Given** two workouts were already planned on the calendar for this week, **When** asking for the week plan, **Then** Claude lists existing workouts and only fills the remaining days.
3. **Given** the athlete agrees to the proposed week, **When** they say "create all of them", **Then** all sessions are pushed to Intervals.icu with correct dates, names, and structured steps.

---

### User Story 3 — Athlete Profile & Goals Setup (Priority: P2)

The athlete sets up or updates their profile: FTP, LTHR, max HR, weight, sport history, A/B/C goal races with dates, weekly training hours, available days, and injury history. Claude persists this to the profile file and confirms the changes.

**Why this priority**: Without an accurate profile, all workout targets and periodization logic are guesswork. Must exist before planning but can be updated incrementally.

**Independent Test**: Run "Update my FTP to 280 W and add an A race on 2026-10-05" and verify the profile file is updated and Claude acknowledges the change.

**Acceptance Scenarios**:

1. **Given** no profile exists, **When** the athlete says "set up my profile", **Then** Claude guides them through FTP, LTHR, weight, available days, and at least one goal race.
2. **Given** an existing profile, **When** the athlete says "my FTP is now 295", **Then** Claude updates the FTP field and recalculates any upcoming workout zones.
3. **Given** the athlete adds an A race 16 weeks away, **When** asking for the macro plan, **Then** Claude proposes a 4-block periodized plan (base, build, peak, taper) that ends on the race date.

---

### User Story 4 — Training Load & Compliance Review (Priority: P2)

The athlete asks for a weekly or monthly review. Claude reads the training log (or fetches completed activities from Intervals.icu), computes planned-vs-actual compliance, comments on load progression, and flags any concerning patterns (e.g., monotony, under-recovery, missed sessions).

**Why this priority**: Retrospective analysis closes the coaching loop and enables adaptive planning.

**Independent Test**: Ask "How was my training last week?" and verify Claude pulls completed workouts, compares to planned, and returns a written review with a compliance percentage.

**Acceptance Scenarios**:

1. **Given** 4 of 5 planned workouts completed, **When** asking for last week's review, **Then** Claude reports 80 % compliance, summarises completed TSS, and notes the missed session without judgment.
2. **Given** three consecutive hard days of training, **When** the weekly review runs, **Then** Claude flags the monotony risk and suggests a recovery day.
3. **Given** load has increased more than 10 % week-over-week, **When** reviewing, **Then** Claude warns about the acute load spike and recommends moderation.

---

### User Story 5 — Custom Workout Creation (Priority: P3)

The athlete describes a specific workout they want ("3×20 min at sweet spot, 5 min off") and Claude translates it into a structured Intervals.icu workout with correct duration, power targets based on current FTP, and pushes it to the calendar on a requested date.

**Why this priority**: Allows athlete-directed sessions beyond the standard template library.

**Independent Test**: Say "Create a sweet-spot workout for Thursday: 3×20 min at 88–93 % FTP, 5 min recovery" and verify it appears on Intervals.icu with correct structured steps.

**Acceptance Scenarios**:

1. **Given** the athlete describes intervals in plain language, **When** Claude parses the request, **Then** it translates duration and %FTP correctly and creates the event.
2. **Given** the athlete does not specify a date, **When** the workout is requested, **Then** Claude confirms or asks which day before creating.
3. **Given** an invalid target (e.g., "120 % FTP for 60 min"), **When** the request is parsed, **Then** Claude flags the physiological implausibility and suggests a realistic alternative.

---

### Edge Cases

- What happens when no FTP is set? → Claude must fetch from Intervals.icu sport settings before building any power-based workout; if unavailable, prompt athlete to set it.
- What if the athlete asks for a workout on a non-available day? → Claude flags the conflict and asks to confirm or reschedule.
- What if Intervals.icu API returns an error? → Claude reports the error clearly and offers retry or manual alternatives.
- What if the athlete is injured and marks rest? → Claude shifts all planned workouts and adjusts the macro plan accordingly.
- What if training availability changes mid-block? → Claude updates the profile and re-sequences the remaining block.

---

## Requirements *(mandatory)*

### Functional Requirements

**Athlete Profile**

- **FR-001**: The system MUST maintain a structured athlete profile containing: FTP (watts), LTHR (bpm), max HR (bpm), weight (kg), primary sports, goal races (name, date, priority A/B/C), weekly training hours budget, available training days, and injury notes.
- **FR-002**: The athlete MUST be able to update any profile field through natural language at any time, with changes persisted immediately.
- **FR-003**: Claude MUST always read current FTP from the profile (or from Intervals.icu sport settings) before generating any power-based workout.

**Periodization**

- **FR-004**: The system MUST support a 4-phase periodized macro plan: Base, Build, Peak, Taper — with configurable block lengths.
- **FR-005**: Each training week MUST be classified by phase and week-in-block, and Claude MUST reference this when deciding session type and intensity.
- **FR-006**: The current training phase MUST be readable from a structured file so Claude can reference it without re-deriving it each session.

**Workout Library**

- **FR-007**: The system MUST include a categorized workout template library covering: Endurance, Tempo, Threshold, VO2max, Anaerobic, and Neuromuscular energy systems, for at least cycling and running.
- **FR-008**: Templates MUST specify intensity as %FTP or %LTHR ranges, not absolute values, so they scale to any athlete.

**Intervals.icu Integration**

- **FR-009**: Claude MUST be able to create, list, update, and delete structured workouts on Intervals.icu via the MCP server.
- **FR-010**: Created workouts MUST include structured steps (warmup, intervals with targets, cooldown) that render correctly in Intervals.icu and sync to linked Garmin devices.
- **FR-011**: Before creating any hard workout, Claude MUST check the current week's existing planned sessions to avoid doubling up hard days.

**Training Log & Analysis**

- **FR-012**: The system MUST maintain a training log recording completed sessions (date, sport, duration, TSS, compliance status).
- **FR-013**: Claude MUST be able to compute week-over-week load progression and flag increases above 10 % as a risk.
- **FR-014**: Claude MUST check readiness signals (provided by athlete or from Intervals.icu wellness data) before prescribing high-intensity sessions.

**Coach Behaviour**

- **FR-015**: Claude MUST proactively suggest the next session or weekly plan without waiting to be asked, when enough context exists.
- **FR-016**: Claude MUST follow 80/20 polarized training distribution by default: ≥80 % of weekly training time below the first lactate threshold, ≤20 % above.
- **FR-017**: Claude MUST respect available training days and never schedule workouts on marked rest days without explicit athlete confirmation.

### Key Entities

- **AthleteProfile**: FTP, LTHR, MaxHR, weight, sports, goal races, weekly hours, available days, injury notes.
- **MacroPlan**: Target event, start date, block sequence (Base/Build/Peak/Taper), block durations, current week pointer.
- **TrainingWeek**: Week number, phase, planned sessions list, completed sessions list, TSS target, compliance %.
- **WorkoutTemplate**: Name, energy system category, sport, intensity zones (%FTP/%LTHR), step structure, typical duration.
- **TrainingLogEntry**: Date, sport, planned vs actual, duration, TSS, notes.
- **ReadinessSignal**: Date, HRV, resting HR, sleep quality (1–5), subjective fatigue (1–5), overall readiness score.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The athlete can receive a specific, correctly-zoned workout suggestion within one conversational turn, without providing raw numbers.
- **SC-002**: A full weekly training plan (5–7 sessions) can be proposed and pushed to Intervals.icu in under 3 minutes of conversation.
- **SC-003**: 100 % of generated workouts use FTP-scaled targets — no hardcoded watt values ever appear in created events.
- **SC-004**: Readiness check is performed before every high-intensity session prescription, with no exceptions.
- **SC-005**: Week-over-week TSS load never increases more than 10 % without an explicit athlete override and acknowledgment.
- **SC-006**: All created Intervals.icu workouts render with full structured steps (not free-text notes) and sync to Garmin within 5 minutes.
- **SC-007**: The athlete can set up or update their full profile in a single conversation without switching to any external tool.
- **SC-008**: Claude correctly identifies and respects the current training phase on 100 % of planning requests.

---

## Assumptions

- The athlete has an active Intervals.icu account with an API key available.
- Garmin Connect is linked inside Intervals.icu (Settings → Garmin) for automatic workout sync.
- The primary sport is cycling (power meter available), with running as secondary (HR-only targets).
- The athlete is a single user; multi-athlete or team use is out of scope.
- The 80/20 polarized training model is the default methodology; the athlete may override to threshold-focused if preferred.
- Wellness/readiness data may be entered manually by the athlete; automatic HRV fetching from Intervals.icu is a nice-to-have.
- The MCP server runs locally via stdio transport; remote/hosted deployment is out of scope for v1.
- Absolute watt targets are never stored — all intensities are expressed as %FTP or %LTHR so the profile FTP is the single source of truth.
- Training log entries for completed activities are sourced from Intervals.icu (via `intervals_list_workouts`) rather than a separate local log where possible.

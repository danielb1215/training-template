# Data Model: AI Training Coach

**Date**: 2026-06-30

All entities are stored as Markdown files. Relationships are expressed through file paths and cross-references, not foreign keys.

---

## AthleteProfile

**File**: `athlete/profile.md`

| Field | Type | Description |
|-------|------|-------------|
| `ftp` | integer (watts) | Functional Threshold Power — primary intensity anchor |
| `lthr` | integer (bpm) | Lactate Threshold Heart Rate for running zones |
| `max_hr` | integer (bpm) | Maximum heart rate |
| `weight_kg` | float | Body weight in kg (for W/kg calculations) |
| `sports` | list | Primary / secondary sports (cycling, running, swimming, strength) |
| `available_days` | list | Days of week available to train (Mon–Sun) |
| `weekly_hours` | float | Target training hours per week |
| `injury_notes` | text | Current or historical injuries / restrictions |
| `updated` | date | Last profile update date |

**Validation**: `ftp` must be present before any power-based workout is created. `lthr` must be present before HR-based running workouts.

---

## Goals

**File**: `athlete/goals.md`

| Field | Type | Description |
|-------|------|-------------|
| `race_name` | string | Event name |
| `race_date` | date (YYYY-MM-DD) | Target race date |
| `priority` | enum (A / B / C) | A = peak for this race; B = tune-up; C = participation |
| `distance` | string | e.g. "Gran Fondo 160 km", "Half Marathon" |
| `sport` | string | Cycling / Running / Triathlon |
| `notes` | text | Course profile, special prep notes |

**State**: Goal races are ordered chronologically. The next A race determines the macro plan end date.

---

## MacroPlan

**File**: `plans/macro.md`

| Field | Type | Description |
|-------|------|-------------|
| `target_race` | string | Name of the A race this plan builds toward |
| `race_date` | date | A race date |
| `plan_start` | date | First day of the Base block |
| `blocks` | list | Ordered list of phases: [{phase, start, end, focus}] |
| `current_block` | string | Active phase name (Base / Build / Peak / Taper) |
| `notes` | text | Season-level notes, backup races, travel blocks |

**State transitions**: Base → Build → Peak → Taper, then plan ends. A new macro plan is created for the next A race.

---

## CurrentBlock (Mesocycle)

**File**: `plans/current-block.md`

| Field | Type | Description |
|-------|------|-------------|
| `phase` | enum | Base / Build / Peak / Taper |
| `block_start` | date | First day of this block |
| `block_end` | date | Last day of this block |
| `week_number` | integer | Current week within block (1-indexed) |
| `total_weeks` | integer | Total weeks in this block |
| `weekly_tss_target` | integer | Target TSS for this week |
| `intensity_distribution` | string | e.g. "80 % Z1-Z2, 20 % Z4-Z5" |
| `key_sessions` | list | List of key session types this week (threshold, VO2max, long ride…) |

---

## CurrentWeek (Microcycle)

**File**: `plans/current-week.md`

| Field | Type | Description |
|-------|------|-------------|
| `week_of` | date | Monday of this training week |
| `planned_sessions` | list | [{day, session_type, duration_min, tss_target, status}] |
| `session.status` | enum | planned / completed / skipped / modified |
| `total_tss_planned` | integer | Sum of session TSS targets |
| `total_tss_actual` | integer | Sum of actual TSS (updated after sessions) |
| `notes` | text | Week-level notes |

---

## WorkoutTemplate

**Files**: `workouts/{sport}/{energy-system}.md`

Each file contains one or more named templates in the following format:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Descriptive name, e.g. "Threshold 3×12 min" |
| `energy_system` | enum | Endurance / Tempo / Threshold / VO2max / Anaerobic / Sprint |
| `sport` | enum | Cycling / Running / Strength |
| `target_ftp_range` | string | e.g. "88–95 % FTP" |
| `target_hr_range` | string | e.g. "93–99 % LTHR" (running) |
| `structure` | text | Plain-language step description |
| `duration_min` | integer | Typical total duration in minutes |
| `tss_estimate` | integer | Approximate TSS |
| `when_to_use` | text | Phase and readiness conditions for this template |
| `scaling_notes` | text | How to modify for beginners / advanced athletes |

---

## TrainingLogEntry

**Files**: `log/YYYY-MM.md` (one file per month)

| Field | Type | Description |
|-------|------|-------------|
| `date` | date | Session date |
| `sport` | string | Cycling / Running / Strength / Rest |
| `planned_type` | string | Session type from the week plan |
| `actual_type` | string | What was actually done |
| `duration_min` | integer | Actual duration |
| `tss_actual` | integer | Actual TSS |
| `compliance` | enum | completed / modified / skipped |
| `notes` | text | Qualitative notes |

---

## ReadinessLog

**File**: `athlete/readiness-log.md`

| Field | Type | Description |
|-------|------|-------------|
| `date` | date | Entry date |
| `hrv` | integer (ms) | Morning HRV (optional, from device) |
| `resting_hr` | integer (bpm) | Morning resting HR (optional) |
| `sleep_quality` | integer (1–5) | Subjective sleep quality |
| `fatigue` | integer (1–5) | Subjective muscle fatigue |
| `motivation` | integer (1–5) | Subjective motivation to train |
| `readiness_score` | integer (1–5) | Composite (auto or manual) |
| `notes` | text | Free text |

**Derived**: `readiness_score = round(mean(sleep_quality, 6−fatigue, motivation))` if not provided manually.

---

## ComplianceTracker

**File**: `log/compliance.md`

| Field | Type | Description |
|-------|------|-------------|
| `week_of` | date | Monday of the week |
| `sessions_planned` | integer | Number of planned sessions |
| `sessions_completed` | integer | Number completed or modified |
| `sessions_skipped` | integer | Number skipped |
| `tss_planned` | integer | Target TSS for the week |
| `tss_actual` | integer | Actual TSS |
| `compliance_pct` | float | sessions_completed / sessions_planned × 100 |
| `load_change_pct` | float | Week-over-week TSS change (flag if > 10 %) |
| `notes` | text | Coach observations |

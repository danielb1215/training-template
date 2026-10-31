# Research: AI Training Coach

**Date**: 2026-06-30

---

## Decision 1: Training Methodology

**Decision**: 80/20 Polarized Training as the default model

**Rationale**: The polarized model (Seiler et al.) is the most evidence-backed methodology for recreational-to-competitive endurance athletes. It prescribes ≥80 % of training volume at low intensity (below first lactate threshold, conversational pace) and ≤20 % at high intensity (above second threshold). The "threshold-heavy" alternative popular in amateur cycling has consistently produced inferior adaptations in research and overuse injury spikes.

**Alternatives considered**:
- Pyramidal (lots of threshold work): Popular but leads to chronic fatigue at high training volumes
- Sweet-spot focused: Efficient for time-crunched athletes; offered as an opt-in override in CLAUDE.md

---

## Decision 2: Periodization Model

**Decision**: 4-phase linear periodization (Base → Build → Peak → Taper)

**Rationale**: Classic linear periodization is well understood, easy for an AI to reason about, and appropriate for single-peak goal events (one A race per season). Block periodization (concentrated loading) is a valid alternative for advanced athletes but requires more sophisticated load management than can be expressed in simple Markdown files.

**Block lengths (defaults)**:
| Phase  | Duration    | Focus |
|--------|-------------|-------|
| Base   | 6–8 weeks   | Aerobic foundation, high volume, low intensity |
| Build  | 6–8 weeks   | Threshold development, specific fitness |
| Peak   | 3–4 weeks   | Race-specific intensity, volume reduction begins |
| Taper  | 1–2 weeks   | Full freshness, race prep, minimal load |

---

## Decision 3: Intensity Zones

**Decision**: 7-zone power model (Coggan) for cycling; 5-zone HR model for running

**Rationale**: The 7-zone Coggan model maps directly to the Intervals.icu zone system and the `workoutBuilder.ts` DSL already uses %FTP targets that align with it. Running uses HR zones (5-zone model, %LTHR) because most athletes don't run with a power meter.

| Zone | Name              | Cycling (%FTP) | Running (%LTHR) |
|------|-------------------|----------------|-----------------|
| Z1   | Active Recovery   | < 55 %         | < 75 %          |
| Z2   | Endurance         | 56–75 %        | 76–85 %         |
| Z3   | Tempo             | 76–87 %        | 86–92 %         |
| Z4   | Threshold         | 88–95 %        | 93–99 %         |
| Z5   | VO2max            | 106–120 %      | 100–106 %       |
| Z6   | Anaerobic         | 121–150 %      | N/A             |
| Z7   | Neuromuscular     | > 150 %        | N/A             |

---

## Decision 4: Readiness Model

**Decision**: Simple 5-point subjective scale, optionally augmented by Intervals.icu wellness data

**Rationale**: HRV-guided training is powerful but requires a reliable HRV device and daily tracking discipline. The simplest approach that works is a subjective readiness score (1–5) asked of the athlete at the start of each session conversation. If the athlete also logs HRV/sleep in Intervals.icu wellness, Claude can fetch it via the API — but this is additive, not required.

**Readiness-to-prescription mapping**:
| Score | Meaning            | Prescription |
|-------|--------------------|--------------|
| 5     | Excellent          | Full key session as planned |
| 4     | Good               | Full key session |
| 3     | Average            | Reduce intensity 5–10 % or shorten duration |
| 2     | Tired              | Endurance / Z2 only |
| 1     | Very fatigued      | Rest or gentle movement only |

---

## Decision 5: TSS / Load Tracking

**Decision**: Reference CTL/ATL/TSB conceptually; track weekly TSS targets in Markdown; actual values live in Intervals.icu

**Rationale**: Intervals.icu already calculates CTL/ATL/TSB from completed activities. Duplicating this calculation locally is unnecessary. The Markdown training log tracks compliance (planned vs actual sessions) and notes, while Intervals.icu is the authoritative source for load metrics. Claude can fetch weekly TSS by listing events and summing `moving_time` × intensity factor.

---

## Decision 6: Data Format

**Decision**: Plain Markdown files for all athlete data and plans; JSON only for machine-readable config

**Rationale**: Markdown is directly readable by Claude without parsing code. The athlete can edit files manually. Version control diffs are human-readable. JSON is used only where structure matters to tooling (`.mcp.json`, `.specify/feature.json`).

---

## Decision 7: Secrets Management

**Decision**: `INTERVALS_API_KEY` set as environment variable; `.env` file for local convenience (git-ignored)

**Rationale**: The MCP server already reads `INTERVALS_API_KEY` from `process.env`. A `.env` file loaded by the user's shell or Claude Desktop config covers local usage without ever committing a secret. The `.gitignore` must include `.env` and any `*.local` variants.

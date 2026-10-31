# Readiness Check Protocol

Used before prescribing any Z4+ session to determine whether full intensity is appropriate.

---

## When to Run

- **Before every training session** — run the objective check silently at session start
- **Before any Z4/Z5+ session specifically** — run the full check including subjective questions if objective data is borderline
- **Weekly progression re-evaluation** — run on Monday to assess last week's adaptation and set this week's intent
- Skip for: rest day confirmations, Z1 recovery rides

---

## Step 1: Pull Objective Data (Always — No Questions Yet)

```
wellness = intervals_get_wellness(oldest: today-7d, newest: today)
today    = wellness[-1]   # most recent entry
```

Extract these fields from today's entry (and the 7-day trend):

| Metric | Field | Good | Caution | Red flag |
|--------|-------|------|---------|----------|
| TSB (Form) | `form` | > 0 | -10 to 0 | < -20 |
| Resting HR | `restingHR` | < athlete baseline | +3–5 bpm above baseline | > +5 bpm above baseline |
| HRV (RMSSD or SDNN) | `hrv` / `hrvSDNN` | > 7-day avg | 5–10% below avg | > 10% below avg |
| Sleep score | `sleepScore` | ≥ 70 | 55–70 | < 55 |
| Sleep duration | `sleepSecs / 3600` | ≥ 7h | 6–7h | < 6h |
| CTL (Fitness) | `ctl` | Stable or rising | — | Dropping sharply |
| ATL (Fatigue) | `atl` | ≤ 1.5× CTL | 1.5–1.8× CTL | > 1.8× CTL |

**Altitude note**: If the athlete lives at altitude (see `athlete/profile.md`), resting HR naturally runs 3–5 bpm higher than at sea level (e.g. at 2,600 m). Evaluate vs personal baseline, not textbook values.

---

## Step 2: Score Objective Readiness

Count how many metrics are in each column above:

| Objective score | Condition |
|----------------|-----------|
| **Green** | 0 red flags, ≤ 1 caution |
| **Yellow** | 1 red flag OR 2+ cautions |
| **Red** | 2+ red flags |

---

## Step 3: Subjective Questions (if Yellow or Red, or data missing)

If objective data is Green and complete → skip to Step 4 directly.

Otherwise ask:
> "Quick check before we get into it — rate each 1–5:
> 1. Sleep quality last night (1=terrible, 5=great)
> 2. Muscle fatigue right now (1=very heavy legs, 5=fresh)
> 3. Motivation to train today (1=really don't want to, 5=ready to go)"

```
subjective_score = round((sleep + fatigue + motivation) / 3)
```

---

## Step 4: Combined Readiness Decision

| Objective | Subjective | Final Readiness | Prescription |
|-----------|-----------|----------------|-------------|
| Green | — (skipped) | Full | Full key session, full intensity |
| Green | 4–5 | Full | Full key session |
| Green | 3 | Moderate | Reduce intensity 5% or cut 15 min |
| Yellow | 4–5 | Moderate | Full key session — monitor during warmup |
| Yellow | 3 | Reduced | Reduce intensity 5–10% or cut 15 min |
| Yellow | 1–2 | Low | Z2 endurance only |
| Red | any | Low | Z2 only or rest |
| Green or Yellow | 1–2 | Low | Z2 only or rest |

**Warmup rule**: If Yellow/Moderate, always check in after the 10-min warmup. If legs still feel dead and HR is elevated at low power → convert to Z2 and log it. A bad day cut short beats a blown session.

---

## Step 5: Log the Entry

Append to `athlete/readiness-log.md`:

```
| YYYY-MM-DD | HRV: X | restHR: X | sleep: Xh/score | TSB: X | subj: X/5 | → [Full/Moderate/Reduced/Z2/Rest] |
```

---

## Re-evaluation Cadence

| When | What gets re-evaluated |
|------|----------------------|
| **Before each session** | Objective data (auto, silent) + subjective if needed |
| **Mid-warmup** | RPE and HR response — override prescription if needed |
| **Monday weekly review** | 7-day wellness trend + compliance + TSB trajectory |
| **After FTP block (6/12/16 wk)** | Full progression model assessment — see `plans/ftp-development.md` |

The **progression model** (when to advance phases, increase load, retest FTP) is evaluated on a **weekly** basis on Mondays, not daily. Daily check-ins only affect whether to do full intensity, reduced, or Z2 for that session.

---

## Interpreting Wellness Trend (7-day view)

| Pattern | Meaning | Action |
|---------|---------|--------|
| TSB rising (less negative or positive) | Recovering well, freshening up | Safe to add load or do key session |
| TSB dropping steadily below -20 | Accumulating fatigue faster than recovering | Insert extra easy day or cut next session |
| Resting HR creeping up 3+ days in a row | Under-recovery, possible illness onset | Switch to Z2 until trend reverses |
| HRV declining trend over 5+ days | Chronic stress or overreaching | Mandatory deload week |
| Sleep score < 60 for 3+ nights | Poor recovery regardless of other metrics | Z2 only until sleep improves |
| ATL > 1.8× CTL | Fatigue spike | No Z4+ until ATL drops |

---

## Notes for Claude

- Always call `intervals_get_wellness` silently at session start — do not narrate the pull to {{ATHLETE_NAME}}
- If `restingHR`, `hrv`, and `sleepScore` are all null (no Garmin data synced yet) → skip to subjective questions immediately
- Never skip the readiness check for Z4+ sessions even if {{ATHLETE_NAME}} says "I feel fine" — review the data first and confirm
- If the objective score is Green but {{ATHLETE_NAME}} rates subjective fatigue at 1 or 2 → trust the athlete, prescribe Z2
- The 7-day trend matters more than a single day's data point — one bad night doesn't cancel a key session; three bad nights does

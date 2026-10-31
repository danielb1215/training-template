# Ride Analysis Protocol

Claude uses this to conduct a deep post-ride analysis using Strava streams. Triggered by "analyze my last ride", "how was that session?", or after any structured workout.

**Scientific basis**: Coggan & Allen (Training and Racing with a Power Meter), Seiler (polarized training), Skiba (W' balance model), Borresen & Lambert (training load quantification).

---

## When to Run

- After any structured cycling session (intervals, tempo, threshold)
- Weekly review of the key sessions
- When athlete asks "how did that ride go?" or "was that session effective?"

---

## Step 1: Fetch Data

```
activity_id = most recent ride from intervals_list_workouts or Strava list_activities

streams = get_activity_streams(activity_id, [
  "time", "watts", "heart_rate", "cadence",
  "velocity_smooth", "altitude", "grade_smooth"
])

performance = get_activity_performance(activity_id)
```

---

## Step 2: Compute Core Metrics

### Normalized Power (NP)
**Source**: Coggan & Allen, 2010

NP corrects for the non-linear physiological cost of variable power output. A ride with frequent surges costs more than its average power suggests.

```
1. Compute 30-second rolling average of watts at each second
2. Raise each rolling average to the 4th power
3. Take the mean of all 4th-power values
4. Take the 4th root of that mean
NP = mean(rolling_avg_30s ^ 4) ^ 0.25
```

**Interpretation**:
- NP ≈ Average Power → very steady effort (trainer, flat TT)
- NP >> Average Power → highly variable (criterium, MTB, interval session)

### Intensity Factor (IF)
```
IF = NP / FTP
```

| IF | Session Character |
|----|------------------|
| < 0.75 | Easy endurance / recovery |
| 0.75–0.85 | Endurance / tempo |
| 0.85–0.95 | Sweet spot / threshold |
| 0.95–1.05 | FTP / threshold intervals |
| > 1.05 | VO2max / anaerobic |

### Training Stress Score (TSS)
**Source**: Coggan, adapted from Banister's TRIMP

```
TSS = (moving_time_seconds × IF² / 3600) × 100
```

| TSS | Session Load | Recovery needed |
|-----|-------------|-----------------|
| < 50 | Low | Next day fine |
| 50–100 | Medium | Light day after |
| 100–150 | High | 1–2 easy days |
| 150–200 | Very high | 2–3 easy days |
| > 200 | Extreme | 3–5 days |

### Variability Index (VI)
```
VI = NP / Average_Power
```

| VI | Power Delivery |
|----|---------------|
| 1.00–1.02 | Very smooth (TT / steady trainer) |
| 1.02–1.05 | Typical road ride or controlled intervals |
| 1.05–1.10 | Variable (punchy course, some surges) |
| > 1.10 | Highly variable (crit, MTB, uncontrolled) |

For interval sessions: VI should be low within each interval (smooth power), higher overall.

---

## Step 3: Time in Zones

### Power Zones (Coggan, % FTP)

| Zone | Name | %FTP | Target |
|------|------|------|--------|
| Z1 | Recovery | < 55% | Warm-up/cool-down |
| Z2 | Endurance | 56–75% | Aerobic base |
| Z3 | Tempo | 76–87% | Sustained effort |
| Z4 | Threshold | 88–95% | FTP intervals |
| Z5 | VO2max | 106–120% | Short hard intervals |
| Z6 | Anaerobic | 121–150% | Very short efforts |
| Z7 | Sprint | > 150% | All-out sprints |

**For polarized training compliance**:
- Z1+Z2 time should be ≥ 80% of total ride time
- Z4+ time should be ≤ 20%
- Z3 (tempo/sweet-spot) > 10% of weekly volume is a warning sign (too much "grey zone")

### HR Zones (Friel 7-zone, % LTHR — same as Intervals.icu)

| Zone | %LTHR | bpm (LTHR 177) | Character |
|------|-------|----------------|-----------|
| Z1 | < 81% | ≤ 142 | Recovery |
| Z2 | 81–89% | 143–158 | Aerobic |
| Z3 | 90–93% | 159–165 | Tempo |
| Z4 | 94–99% | 166–176 | SubThreshold |
| Z5a | 100–102% | 177–181 | SuperThreshold |
| Z5b | 103–105% | 182–186 | Aerobic Capacity |
| Z5c | > 105% | ≥ 187 | Anaerobic |

Use Intervals' `icu_hr_zone_times` directly — the zones match. Recompute bpm if LTHR changes.

---

## Step 4: Aerobic Decoupling (Pw:HR)
**Source**: Friel, The Cyclist's Training Bible

Measures how well HR and power stay coupled over a long session. If aerobic fitness is good, the power:HR ratio stays stable. If HR drifts up relative to power output, it signals dehydration, heat stress, or insufficient aerobic base.

```
Split the ride at the midpoint (by time):

first_half_ratio  = mean(watts[0:mid]) / mean(HR[0:mid])
second_half_ratio = mean(watts[mid:end]) / mean(HR[mid:end])

decoupling_pct = (first_half_ratio - second_half_ratio) / first_half_ratio × 100
```

| Decoupling % | Interpretation |
|-------------|----------------|
| < 3% | Excellent aerobic fitness, well within aerobic capacity |
| 3–5% | Good — aerobic system coping well |
| 5–8% | Moderate — approaching aerobic limit or some fatigue |
| > 8% | High — aerobic base insufficient for this intensity, or heat/dehydration |

**Altitude note (only if the athlete trains at altitude, e.g. 2,600 m)**: Decoupling naturally runs 1–2% higher at altitude due to reduced oxygen delivery. Adjust thresholds accordingly (< 5% = excellent, 5–7% = good).

---

## Step 5: Interval Quality (for structured sessions)

For each work interval, extract from lap data:

```
- Avg power (% FTP)
- Power std deviation (lower = more consistent)
- Avg HR
- Max HR
- Power fade: compare first half watts vs second half watts within interval
  fade_pct = (first_half_avg - second_half_avg) / first_half_avg × 100
  < 3% fade = excellent pacing
  > 5% fade = starting too hard
```

**HR progression across intervals** (cardiac drift):
- Expect HR to rise 3–5 bpm per interval even at identical power — normal
- Rise > 8 bpm per interval = fatigue accumulation, too much load

**Recovery quality** (between intervals):
```
HR_drop = peak_HR_end_of_interval - avg_HR_last_30s_of_recovery
> 20 bpm drop = good recovery
< 15 bpm drop = insufficient recovery time or high fatigue
```

---

## Step 6: Altitude Adjustment (only if training at altitude)

At altitude (e.g. 2,600 m), FTP is approximately 8–10% lower than sea level due to reduced VO2max from lower partial pressure of oxygen.

```
altitude_ftp_factor ≈ 1 - (altitude_m / 1000) × 0.03  (rough rule)
altitude_ftp_factor at 2600m ≈ 0.922

effective_ftp_altitude ≈ sea_level_ftp × 0.922
```

When interpreting %FTP metrics, note: an effort at 82% of sea-level FTP is actually ~89% of altitude-adjusted FTP — closer to threshold than it appears.

**Practical implication**: If FTP was tested at altitude, all zones are already calibrated correctly. If tested at sea level, scale zones down ~8%.

---

## Step 7: Cadence Analysis

| Metric | Good Range | Notes |
|--------|-----------|-------|
| Mean cadence | 85–95 rpm | Lower = more muscular, higher = more cardiovascular |
| % time < 75 rpm | < 10% | Low cadence = higher muscular stress |
| % time > 100 rpm | < 15% | Very high cadence = less efficient for most athletes |
| Cadence in Z4+ intervals | 85–95 rpm | Optimal neuromuscular efficiency at threshold |

---

## Step 8: Output Report Format

```markdown
## Ride Analysis: [Ride Name] — [Date]

**Duration**: Xh Xmin | **Distance**: X km | **Elevation**: X m

### Core Metrics
| Metric | Value | Assessment |
|--------|-------|------------|
| Average Power | XW (X% FTP) | |
| Normalized Power | XW (X% FTP) | |
| Intensity Factor | X.XX | [Easy/Endurance/Tempo/Threshold/VO2max] |
| TSS | XX | [Low/Medium/High/Very High] — X easy days recommended |
| Variability Index | X.XX | [Smooth/Moderate/Variable] |
| Aerobic Decoupling | X.X% | [Excellent/Good/Moderate/High] |

### Time in Power Zones
| Zone | Time | % |
|------|------|---|
| Z1 Recovery | | |
| Z2 Endurance | | |
| Z3 Tempo | | |
| Z4 Threshold | | |
| Z5+ Hard | | |

**Polarized check**: [Z1+Z2 = X% ✅/⚠️] [Z4+ = X%] [Z3 = X%]

### Interval Quality (if structured session)
| Block | Avg Power | %FTP | Avg HR | %LTHR | HR Fade | Pacing |
|-------|-----------|------|--------|-------|---------|--------|
| Block 1 | | | | | | |
| Block 2 | | | | | | |
...

**HR drift across blocks**: X → X → X bpm (X bpm total drift)
**Recovery quality**: HR dropped avg X bpm between efforts

### Key Findings
1. [Most important observation]
2. [Second observation]
3. [Third observation]

### Coach Recommendation
[1–2 sentences: what this session tells us about current fitness and what to do next]
```

---

## Notes for Claude

- Always retrieve **both** `get_activity_streams` and `get_activity_performance` for structured sessions
- Use `get_activity_performance` lap data first for structured sessions — it already splits the intervals
- For very long streams (> 2h rides), use `resolution` parameter to downsample (e.g. `resolution: 30`) to reduce data volume while retaining enough granularity for zone analysis
- Never report power in absolute watts without also reporting %FTP — context is everything
- Always flag the altitude context when interpreting decoupling or RPE vs power mismatch
- Compare key metrics to previous sessions of the same type to show trend

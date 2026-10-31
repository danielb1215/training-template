# Workout Library

All workout templates in this library use **relative intensity** — %FTP for cycling, %LTHR for running. Claude always reads your current FTP from `athlete/profile.md` or from Intervals.icu before building a workout. Absolute watt values are never stored.

---

## Intensity Zones

### Cycling — 7-Zone Coggan Power Model

| Zone | Name | %FTP | Feel | Typical Session |
|------|------|------|------|-----------------|
| Z1 | Active Recovery | < 55 % | Very easy, could hold conversation indefinitely | Recovery spin |
| Z2 | Endurance | 56–75 % | Comfortable, full sentences, fat-burning | Long aerobic base rides |
| Z3 | Tempo | 76–87 % | Moderately hard, short sentences | Tempo / sweet-spot |
| Z4 | Threshold | 88–95 % | Hard, 1–2 word answers, sustainable ~60 min | FTP intervals |
| Z5 | VO2max | 106–120 % | Very hard, 3–8 min efforts | VO2max repeats |
| Z6 | Anaerobic | 121–150 % | Extremely hard, < 3 min efforts | Short hard efforts |
| Z7 | Neuromuscular | > 150 % | Maximal sprint, < 30 s | Sprint power |

### Cycling — 7-Zone Friel Heart Rate Model (%LTHR)

Same zones Intervals.icu uses (Settings → Cycling), so analysis labels match Intervals and Garmin. bpm at LTHR 177.

| Zone | Name | %LTHR | bpm | Feel | Typical Session |
|------|------|-------|-----|------|-----------------|
| Z1 | Recovery | < 81 % | ≤ 142 | Very easy | Recovery spin, warm-up |
| Z2 | Aerobic | 81–89 % | 143–158 | Comfortable, full sentences | Endurance / long rides |
| Z3 | Tempo | 90–93 % | 159–165 | Moderately hard | Tempo |
| Z4 | SubThreshold | 94–99 % | 166–176 | Hard | Threshold intervals |
| Z5a | SuperThreshold | 100–102 % | 177–181 | Very hard | Threshold / over-unders |
| Z5b | Aerobic Capacity | 103–105 % | 182–186 | Very hard, 3–8 min | VO2max repeats |
| Z5c | Anaerobic | > 105 % | ≥ 187 | Maximal | Short hard efforts |

HR lags 1–3 min behind effort — for intervals ≤ 5 min, target power, not HR. Polarized "easy" = Z1–Z2; "hard" = Z4+.

### Running — 5-Zone Heart Rate Model (%LTHR)

| Zone | Name | %LTHR | Feel | Typical Session |
|------|------|-------|------|-----------------|
| Z1 | Easy | < 75 % | Conversational | Recovery run |
| Z2 | Aerobic | 76–85 % | Comfortable | Easy/long run |
| Z3 | Tempo | 86–92 % | Comfortably hard | Tempo run |
| Z4 | Threshold | 93–99 % | Hard but sustainable | Cruise intervals |
| Z5 | VO2max | 100–106 % | Very hard | Track intervals |

---

## 80/20 Polarized Rule

By default, ≥ **80 %** of weekly training time is in Z1–Z2 (easy). ≤ **20 %** is in Z4+ (hard). Z3 (tempo/sweet-spot) is used sparingly — it creates fatigue without the same adaptation stimulus as Z4–Z5.

**Example polarized week (8 h):**
- 6h 24 min in Z1–Z2 (80 %)
- 1h 36 min in Z4–Z5 (20 %)
- 0 h in Z3 (strict polarized) or up to 30 min (mild pyramidal variant)

---

## Template Format

Each template file contains named sessions in this structure:

```
### [Session Name]
**Energy system**: [zone]
**Sport**: Cycling / Running
**When to use**: [phase and readiness conditions]
**Duration**: [total minutes]
**TSS estimate**: [approximate TSS]

**Structure**:
- Warmup: [duration] @ [zone]
- [Main set description]
- Cooldown: [duration] @ [zone]

**Targets**:
- Cycling: [%FTP range]
- Running: [%LTHR range]

**Scaling**:
- Easier: [modification]
- Harder: [modification]
```

---

## How Claude Uses These Templates

1. Reads the current phase from `plans/current-block.md`
2. Selects the appropriate energy system for the day's key session
3. Picks a matching template from this library
4. Scales targets to your current FTP/LTHR from `athlete/profile.md`
5. Creates the workout on Intervals.icu via the MCP server

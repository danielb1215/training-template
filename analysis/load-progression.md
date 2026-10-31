# Load Progression Reference

Claude uses this to enforce safe training load increases and interpret Intervals.icu fitness metrics.

---

## The 10 % Rule

**Week-over-week TSS must not increase by more than 10 %** without explicit athlete acknowledgment.

```
load_change = (this_week_tss - last_week_tss) / last_week_tss × 100

If load_change > 10 %:
  Warn: "This week's plan (X TSS) is Y % higher than last week (Z TSS).
         This exceeds the recommended 10 % ramp rate.
         Shall I scale it back to [safe_tss]?"
```

`safe_tss = last_week_tss × 1.10`

---

## CTL / ATL / TSB Explained

Intervals.icu calculates these automatically. Claude references them for context.

| Metric | Name | What it means |
|--------|------|---------------|
| CTL | Chronic Training Load (Fitness) | Rolling 42-day TSS average — your fitness level |
| ATL | Acute Training Load (Fatigue) | Rolling 7-day TSS average — your current fatigue |
| TSB | Training Stress Balance (Form) | CTL − ATL — positive = fresh, negative = fatigued |

### TSB Interpretation

| TSB | Status | Appropriate Training |
|-----|--------|---------------------|
| +25 or more | Very fresh / detrained | Build load — you may be under-training |
| +10 to +25 | Fresh / tapered | Race-ready or ready for a big training block |
| 0 to +10 | Neutral | Steady training, maintain |
| −10 to 0 | Slightly fatigued | Normal training load, recovery needed |
| −20 to −10 | Fatigued | Reduce intensity, prioritise sleep |
| −30 or lower | Overreached | Full rest days mandatory |

---

## Progressive Overload Pattern

A healthy 4-week mesocycle:

| Week | Load | Purpose |
|------|------|---------|
| Week 1 | 100 % of target TSS | Adaptation |
| Week 2 | 105–110 % | Progressive overload |
| Week 3 | 110–115 % | Overreach stimulus |
| Week 4 | 60–70 % | Recovery / supercompensation |

Then increase the base for the next block by 5–10 %.

---

## Warning Signs of Over-Training

Claude flags these patterns and recommends rest:

- TSB below −30 for 5+ consecutive days
- 3 or more hard sessions (Z4+) in a row without a rest or Z1 day
- Week-over-week TSS increase > 20 % (regardless of athlete override)
- Resting HR elevated > 5 bpm above normal for 3+ days (if logged in readiness-log.md)
- Readiness score ≤ 2 for 3+ consecutive days

---

## How to Read the Intervals.icu Fitness Chart

1. Go to **intervals.icu → Fitness** (left sidebar)
2. The blue line (CTL) is your fitness — aim for gradual upward trend
3. The pink line (ATL) is your fatigue — spikes after hard blocks are normal
4. The yellow line (TSB) is your form — should be positive (or slightly negative) on race day
5. For an A race: plan to have TSB around +10 to +20 on race morning (via taper)

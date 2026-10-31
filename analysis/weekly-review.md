# Weekly Review Prompt

Claude uses this template to conduct a structured weekly training review. Run after the last session of the week or on Monday morning.

---

## How to Trigger

Say any of:
- "Review my training from last week"
- "How was my week?"
- "Weekly review"

---

## Review Workflow (Claude follows this)

### Step 1: Pull Completed Sessions

Call `intervals_list_workouts` with:
- `oldest`: Last Monday (YYYY-MM-DD)
- `newest`: Last Sunday (YYYY-MM-DD)
- `category`: WORKOUT

### Step 2: Compare to Plan

Read `plans/current-week.md` (or last week's plan if already updated).

For each planned session:
- Was it completed, modified, or skipped?
- If modified: what changed (shorter, lower intensity, different sport)?

### Step 3: Compute Metrics

```
sessions_planned = count rows in current-week.md
sessions_completed = count with status "completed" or "modified"
sessions_skipped = count with status "skipped"
compliance_pct = sessions_completed / sessions_planned × 100

tss_planned = sum of TSS targets from current-week.md
tss_actual = sum of actual TSS from Intervals.icu events
load_change_pct = (tss_actual - last_week_tss) / last_week_tss × 100
```

Read last week's TSS from `log/compliance.md`.

### Step 4: Flag Issues

Automatically flag:
- **Compliance < 70 %** → missed sessions warning
- **Load change > +10 %** → acute load spike warning
- **3+ consecutive hard sessions** → monotony / overreaching warning
- **2+ skipped sessions in a row** → check athlete is OK, not injured

### Step 5: Write Summary

Output a summary in this format:

```
## Week of [YYYY-MM-DD] Review

**Compliance**: X/Y sessions (Z %)
**TSS**: [planned] planned → [actual] actual
**Load change vs last week**: +/- X %

**Completed**:
- [Day]: [session name] ✅
- ...

**Skipped / Modified**:
- [Day]: [planned] → [what happened]

**Flags**:
- [Any warnings from Step 4]

**Coach notes**:
[1–2 sentences of qualitative feedback]

**For next week**:
[1–2 sentences suggesting adjustment if any]
```

### Step 6: Update Files

1. Append the week's row to `log/compliance.md`
2. Append completed sessions to `log/YYYY-MM.md`
3. Suggest updating `plans/current-week.md` for the upcoming week

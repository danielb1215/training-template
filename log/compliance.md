# Training Compliance Log

Weekly summary of planned vs actual training. Claude reads this to enforce the 10 % load progression rule.

| Week of | Sessions Planned | Completed | Skipped | TSS Planned | TSS Actual | Compliance % | Load Change % | Notes |
|---------|-----------------|-----------|---------|-------------|------------|--------------|---------------|-------|
| <!-- YYYY-MM-DD --> | | | | | | | | |

## Load Progression Rule

Week-over-week TSS increase must not exceed **+10 %** without explicit athlete acknowledgment.

Formula: `load_change_pct = (tss_actual_this_week - tss_actual_last_week) / tss_actual_last_week × 100`

If `load_change_pct > 10`, Claude will warn before creating the weekly plan.

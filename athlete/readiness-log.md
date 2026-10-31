# Readiness Log

Track daily readiness to guide session intensity. Claude reads this before prescribing hard sessions.

## Scoring Guide

| Metric | Scale | Meaning |
|--------|-------|---------|
| Sleep quality | 1–5 | 1 = terrible, 5 = perfect |
| Fatigue | 1–5 | 1 = exhausted, 5 = fresh (inverted — high = good) |
| Motivation | 1–5 | 1 = none, 5 = ready to race |
| **Readiness score** | **1–5** | **`round(mean(sleep, fatigue, motivation))`** |

## Prescription by Readiness Score

| Score | Prescription |
|-------|-------------|
| 5 | Full key session as planned |
| 4 | Full key session |
| 3 | Reduce intensity 5–10 % or shorten by 15 min |
| 2 | Z2 endurance only — no intervals |
| 1 | Rest or gentle movement (walk, yoga) |

## Log

| Date | HRV (ms) | Resting HR | Sleep (1–5) | Fatigue (1–5) | Motivation (1–5) | Score | Notes |
|------|----------|------------|-------------|---------------|------------------|-------|-------|
| <!-- YYYY-MM-DD --> | | | | | | | |

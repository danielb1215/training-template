/**
 * Helpers for building Intervals.icu structured workout descriptions.
 *
 * Intervals.icu parses plain-text workout steps out of the event
 * `description` field using a simple DSL, e.g.:
 *
 *   - Warmup 10m 50-60% FTP
 *   - 4x
 *     - 4m 105-110% FTP
 *     - 3m 50% FTP
 *   - Cooldown 10m 50% FTP
 *
 * Percentages are relative to the athlete's FTP (for power) or
 * LTHR/max HR (for heart rate), depending on the target type used.
 * This module gives Claude (or any caller) a structured way to build
 * that text instead of hand-formatting it every time.
 */
function isRepeat(block) {
    return "steps" in block;
}
function formatDuration(seconds) {
    if (seconds % 60 === 0) {
        return `${seconds / 60}m`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m${secs}s` : `${secs}s`;
}
function formatStep(step, indent) {
    const type = step.targetType ?? "FTP";
    const suffix = type === "FTP" ? "FTP" : type === "LTHR" ? "LTHR" : "Max HR";
    const cadencePart = step.cadence ? ` ${step.cadence}rpm` : "";
    const labelPart = step.label ? `${step.label} ` : "";
    return `${indent}- ${labelPart}${formatDuration(step.duration)} ${step.targetLowPct}-${step.targetHighPct}% ${suffix}${cadencePart}`;
}
/**
 * Renders a list of workout blocks (steps and/or repeats) into the
 * plain-text format Intervals.icu parses for structured workouts.
 */
export function renderWorkoutText(blocks) {
    const lines = [];
    for (const block of blocks) {
        if (isRepeat(block)) {
            // Intervals.icu only treats "Nx" as a repeat header when it is a bare
            // line wrapped in blank lines; "- Nx" with indented steps is flattened.
            lines.push("", `${block.count}x`);
            for (const step of block.steps) {
                lines.push(formatStep(step, ""));
            }
            lines.push("");
        }
        else {
            lines.push(formatStep(block, ""));
        }
    }
    return lines.join("\n");
}
/** Total planned moving time for a set of blocks, in seconds. */
export function totalDuration(blocks) {
    let total = 0;
    for (const block of blocks) {
        if (isRepeat(block)) {
            const repSum = block.steps.reduce((acc, s) => acc + s.duration, 0);
            total += repSum * block.count;
        }
        else {
            total += block.duration;
        }
    }
    return total;
}
/* ---------------------------------------------------------------------- */
/* Common workout templates (FTP-relative), tuned for road cycling        */
/* ---------------------------------------------------------------------- */
export function warmup(minutes = 10) {
    return {
        duration: minutes * 60,
        targetLowPct: 50,
        targetHighPct: 65,
        label: "Warmup",
    };
}
export function cooldown(minutes = 10) {
    return {
        duration: minutes * 60,
        targetLowPct: 45,
        targetHighPct: 55,
        label: "Cooldown",
    };
}
export function thresholdSession(opts) {
    const { reps, workMinutes, restMinutes, lowPct = 88, highPct = 95, warmupMinutes = 12, cooldownMinutes = 10, } = opts;
    return [
        warmup(warmupMinutes),
        {
            count: reps,
            steps: [
                {
                    duration: workMinutes * 60,
                    targetLowPct: lowPct,
                    targetHighPct: highPct,
                    label: "Threshold",
                },
                {
                    duration: restMinutes * 60,
                    targetLowPct: 45,
                    targetHighPct: 55,
                    label: "Recovery",
                },
            ],
        },
        cooldown(cooldownMinutes),
    ];
}
export function vo2maxSession(opts) {
    const { reps, workMinutes, restMinutes, lowPct = 106, highPct = 120, warmupMinutes = 15, cooldownMinutes = 10, } = opts;
    return [
        warmup(warmupMinutes),
        {
            count: reps,
            steps: [
                {
                    duration: workMinutes * 60,
                    targetLowPct: lowPct,
                    targetHighPct: highPct,
                    label: "VO2max",
                },
                {
                    duration: restMinutes * 60,
                    targetLowPct: 40,
                    targetHighPct: 50,
                    label: "Recovery",
                },
            ],
        },
        cooldown(cooldownMinutes),
    ];
}
export function sprintSession(opts) {
    const { reps, workSeconds, restSeconds, lowPct = 150, highPct = 220, warmupMinutes = 15, cooldownMinutes = 10, } = opts;
    return [
        warmup(warmupMinutes),
        {
            count: reps,
            steps: [
                {
                    duration: workSeconds,
                    targetLowPct: lowPct,
                    targetHighPct: highPct,
                    label: "Sprint",
                },
                {
                    duration: restSeconds,
                    targetLowPct: 30,
                    targetHighPct: 45,
                    label: "Recovery",
                },
            ],
        },
        cooldown(cooldownMinutes),
    ];
}
export function endurance(opts) {
    const { totalMinutes, lowPct = 60, highPct = 75 } = opts;
    return [
        {
            duration: totalMinutes * 60,
            targetLowPct: lowPct,
            targetHighPct: highPct,
            label: "Endurance",
        },
    ];
}

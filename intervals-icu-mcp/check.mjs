#!/usr/bin/env node
// Verifies the Intervals.icu API key and prints the athlete's current numbers.
//   node intervals-icu-mcp/check.mjs
// Reads the key from the environment or intervals-icu-mcp/.env. Never prints the key.
import { loadEnv } from "./launch.mjs";
import { IntervalsClient } from "./dist/intervalsClient.js";

loadEnv();
const apiKey = process.env.INTERVALS_API_KEY;
if (!apiKey) {
  console.error("NO_KEY: set INTERVALS_API_KEY in intervals-icu-mcp/.env");
  process.exit(1);
}
const client = new IntervalsClient({ apiKey, athleteId: process.env.INTERVALS_ATHLETE_ID || "0" });

try {
  const p = await client.getProfile();
  const athlete = p.athlete ?? p;
  const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o?.[k] != null && o[k] !== "").map((k) => [k, o[k]]));
  const settings = await client.getSportSettings();
  const sports = (Array.isArray(settings) ? settings : settings?.sportSettings ?? [settings]).map((s) =>
    pick(s, ["types", "ftp", "indoor_ftp", "w_prime", "lthr", "max_hr", "threshold_pace", "pace_units"])
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        athlete: pick(athlete, ["id", "name", "firstname", "lastname", "sex", "timezone", "city", "country", "weight", "icu_weight", "icu_resting_hr"]),
        sportSettings: sports,
      },
      null,
      2
    )
  );
} catch (e) {
  console.error(`API_ERROR: ${e?.status ?? ""} ${e?.message ?? e}`);
  console.error("401/403 = wrong key. Copy it again from https://intervals.icu/settings → Developer Settings.");
  process.exit(1);
}

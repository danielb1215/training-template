#!/usr/bin/env node
// Zero-setup launcher for the Intervals.icu MCP server (used by ../.mcp.json).
//  1. Loads INTERVALS_API_KEY / INTERVALS_ATHLETE_ID from ./.env (git-ignored)
//     unless they are already set in the environment.
//  2. Installs runtime dependencies on first run (npm install --omit=dev).
//  3. Starts the prebuilt server in ./dist.
// stdout is reserved for the MCP protocol, so all logging goes to stderr.
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export function loadEnv() {
  const file = join(here, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, "$2");
    if (!process.env[m[1]] && value && value !== "your_api_key_here") process.env[m[1]] = value;
  }
}

function ensureDeps() {
  if (existsSync(join(here, "node_modules", "@modelcontextprotocol", "sdk"))) return;
  console.error("[intervals-icu] First run: installing dependencies (npm install --omit=dev)...");
  const r = spawnSync("npm", ["install", "--omit=dev", "--no-audit", "--no-fund"], {
    cwd: here,
    stdio: ["ignore", 2, 2],
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    console.error("[intervals-icu] npm install failed. Run it manually: cd intervals-icu-mcp && npm install");
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadEnv();
  if (!process.env.INTERVALS_API_KEY) {
    console.error(
      "[intervals-icu] No API key. Put INTERVALS_API_KEY=... in intervals-icu-mcp/.env " +
        "(get it at https://intervals.icu/settings → Developer Settings), then restart Claude Code or run /mcp → Reconnect."
    );
    process.exit(1);
  }
  ensureDeps();
  await import("./dist/index.js");
}

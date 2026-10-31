#!/usr/bin/env bash
# One-time personalisation: replaces {{ATHLETE_*}} / {{TIMEZONE}} placeholders.
set -euo pipefail
cd "$(dirname "$0")"

if ! grep -rqI '{{ATHLETE_NAME}}\|{{TIMEZONE}}' --exclude=setup.sh --exclude=ONBOARDING.md --exclude-dir=.git --exclude-dir=node_modules . ; then
  echo "Already personalised — nothing to do."; exit 0
fi

# Non-interactive: FULL=".." FIRST=".." EMAIL=".." TZONE=".." ./setup.sh
FULL=${FULL:-} FIRST=${FIRST:-} EMAIL=${EMAIL:-} TZONE=${TZONE:-}
[ -n "$FULL" ]  || read -rp "Full name (e.g. Ana María Pérez): " FULL
[ -n "$FIRST" ] || read -rp "First name Claude should call you (e.g. Ana): " FIRST
[ -n "$EMAIL" ] || read -rp "Email: " EMAIL
SYS_TZ="$(readlink /etc/localtime 2>/dev/null | sed -n "s|.*zoneinfo/||p")"
SYS_TZ=${SYS_TZ:-UTC}
[ -n "$TZONE" ] || read -rp "Time zone, IANA format, e.g. Europe/Madrid [$SYS_TZ]: " TZONE
TZONE=${TZONE:-$SYS_TZ}

if ! TZ="$TZONE" date >/dev/null 2>&1 || [ ! -e "/usr/share/zoneinfo/$TZONE" ]; then
  echo "Warning: '$TZONE' not found in /usr/share/zoneinfo — check the spelling (e.g. Europe/Madrid)."
fi

export FULL FIRST EMAIL TZONE
grep -rlI '{{ATHLETE_\|{{TIMEZONE}}' --exclude=setup.sh --exclude=ONBOARDING.md --exclude-dir=.git --exclude-dir=node_modules . |
  while IFS= read -r f; do
    perl -pi -e 's/\{\{ATHLETE_FULL_NAME\}\}/$ENV{FULL}/g; s/\{\{ATHLETE_NAME\}\}/$ENV{FIRST}/g; s/\{\{ATHLETE_EMAIL\}\}/$ENV{EMAIL}/g; s/\{\{TIMEZONE\}\}/$ENV{TZONE}/g' "$f"
    echo "  updated $f"
  done

echo
echo "Done. Next: open Claude Code here and say \"configura mi entrenador\" (or see README.md for manual setup)."

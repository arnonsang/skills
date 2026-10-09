#!/usr/bin/env bash
# Fleet preflight: Herdr context, memory headroom, existing agents and dev servers.
set -u

if [ "${HERDR_ENV:-}" != "1" ]; then
  echo "FAIL: not inside a Herdr pane (HERDR_ENV != 1). Do not drive Herdr from outside."
  exit 1
fi
echo "OK: inside Herdr. our pane=${HERDR_PANE_ID:-?} workspace=${HERDR_WORKSPACE_ID:-?} tab=${HERDR_TAB_ID:-?}"

avail=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)
total=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)
if [ "$avail" -lt 2000 ]; then
  echo "WARN: MemAvailable ${avail} MB of ${total} MB - below 2000 MB, launch at most one worker and no heavy jobs"
else
  echo "OK: MemAvailable ${avail} MB of ${total} MB (budget ~0.5 GB per idle agent, several GB per build/browser)"
fi

echo "--- agents already running (NOT ours unless in the ledger) ---"
herdr agent list 2>/dev/null | python3 -c '
import json, sys
try:
    agents = json.load(sys.stdin)["result"]["agents"]
except Exception:
    sys.exit("(agent list failed)")
print(f"{len(agents)} agents")
for a in agents:
    g = lambda k, d="-": a.get(k) or d
    print("%-10s %-7s %-8s %-14s %s" % (g("pane_id"), g("agent"), g("agent_status"), g("name"), g("cwd", "")))
' 

echo "--- dev servers / builds already running ---"
ps -eo pid,rss,args 2>/dev/null | grep -E "next dev|next build|bun .*index\.ts|vite|webpack|playwright|chrom" | grep -v grep | awk '{printf "%s %dMB %s\n", $1, $2/1024, substr($0, index($0,$3), 120)}' || true

echo "--- agent kinds this Herdr supports ---"
herdr agent 2>&1 | grep -E "kinds:" || true

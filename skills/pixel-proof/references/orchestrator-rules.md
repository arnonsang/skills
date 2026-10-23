# Orchestrator rules for verification

- A worker's report is a claim. Re-run the gate yourself on the merged result, read the diff, look at screenshots. Reports have been wrong about ports, stale servers and which build was tested.
- Never rebuild or restart a server a QA worker is using; the `.next` swap kills its session. Edit source while it runs, build after the report lands.
- Give each worker its own worktree and port. Serialize builds and browser jobs with `flock /tmp/<project>-heavy.lock`, and check `MemAvailable` (needs about 2 GB) before launching another job.
- Background servers started inside a `flock` command inherit the lock file descriptor. If the server outlives the command (a subshell kill leaves the real process), every later `flock` waits forever. Symptom: a build hangs for minutes with no process. Find it with `fuser -v <lockfile>` and kill that pid. Start servers with `python3 -m http.server --directory X &` or `node ... &` directly, never inside `(cd X && cmd) &`, so `$!` is the real pid.
- Start Next servers with `node node_modules/next/dist/bin/next start -p PORT`, not `npx`, so `kill $!` stops the actual server. A stale server on the port serves old assets and gives unstyled screenshots or checks of the wrong build: before every run, find the owner with `ss -ltnp | grep :PORT` and kill that pid. `pkill -f` can kill your own shell.
- Do not chain `A && B &` to background a build then start the server; the checker hits a dead port. Run build to completion, then start the server, then check.
- Git worktrees with a symlinked `node_modules` break Turbopack; build workers with `--webpack`.
- When a check fails, decide whose it is: fix your own files; for upstream markup or CSS you cannot change, record the exact line and move on rather than hacking around it.
- Keep a ledger of panes, worktrees and ports, and close the panes you opened when the slice is merged.

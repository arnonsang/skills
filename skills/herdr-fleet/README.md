# herdr-fleet

Run a parallel coding fleet through Herdr: one orchestrator agent plans, briefs, verifies and integrates while several worker agents implement in their own panes.

```bash
npx skills add arnonsang/skills --skill herdr-fleet
```

## What it does

1. **Preflight:** checks that you are inside Herdr, how much memory is free, and which agents already run (those belong to someone else).
2. **Slices the plan** into pieces that own separate files, ordered in waves, and confirms the split with you.
3. **Asks once per run** which agent kind and model fills each role (worker, reviewer) and how many workers may run at once.
4. **Isolates every worker** in its own git worktree and, when the tests write to a database, its own cloned database.
5. **Briefs by file:** the goal, the owned files, done-when checks, verify commands, and the safety rules.
6. **Watches in the background** with `herdr agent wait`, so the orchestrator keeps working instead of blocking.
7. **Verifies itself:** reads every diff and reruns every check rather than trusting the worker's report.
8. **Integrates in wave order** and hands commits to you; it never adds attribution trailers or pushes unasked.
9. **Pane lifecycle:**
   - Follow-ups go to the agent that already holds the context.
   - New, unrelated work gets a fresh agent.
   - Only panes this run created are ever closed, and only after the whole queue is done.

## The story

I build a production AI platform mostly by orchestrating coding agents: one agent plans and reviews while several others implement in parallel, each in its own Herdr pane. It is fast when it works. In the early runs it often did not.

Every rule in this skill exists because something went wrong:

- **A worker ran the formatter in write mode** and rewrote files that another worker was editing. Briefs now forbid write-mode formatters and linters.
- **Two workers ran the test suite against the same database.** Each truncated the other's rows, and one worker spent a whole cycle chasing a foreign-key error that was not real. Each worker now gets its own worktree and a cloned database, never a freshly migrated empty one.
- **Shared checkouts broke compiles.** The test step compiled the whole tree, so one half-written file failed everyone. Now each worker has its own worktree.
- **Idle agents from other projects looked like leftovers.** Closing them would have killed someone else's work. The skill keeps a ledger and only touches panes it created.
- **About 30 resumed agents plus a build and a headless browser ran a 16 GB machine out of memory.** Heavy jobs now wait for free memory and run one at a time.
- **A long multi-line prompt was typed into a shell** after its agent had exited. Briefs are now files, sent as a one-line prompt.
- **Workers claimed tests passed when they had not.** The orchestrator reruns every check itself before anything is merged.

The first live evaluation turned up four more problems that only show with real agents:
- Codex sometimes drops the first prompt.
- It stops at a folder-trust question in a new worktree.
- Agent names collide across sessions.
- Some agents refuse to write outside their working directory.

The skill now handles all four.

## Does it help?

Measured on real Herdr runs with real codex workers, with and without the skill:

| | With skill | Without |
|---|---|---|
| Two independent slices | 15 / 15 checks | 14 / 15 |
| Dependent waves plus a follow-up fix | 19 / 19 | 17 / 19 |
| Time per run | 234 s | 246 s |

The checks cover:
- a green integration branch;
- each worker in its own worktree;
- briefs carrying the safety rules;
- background monitoring rather than a blocking wait;
- the orchestrator verifying the work itself;
- follow-ups going to the worker that already has the context;
- the 24 panes from other work left untouched, and every pane the run created closed.

The test prompts are in [`evals/evals.json`](evals/evals.json).

## Requirements

- Herdr, with the agent running inside a Herdr pane (`HERDR_ENV=1`). The base `herdr` skill that ships with Herdr is recommended alongside this one.
- git, bash, python3.
- Optional: PostgreSQL client tools (`createdb`, `pg_dump`, `psql`) when workers need their own test database.

## Files

| Path | Purpose |
|---|---|
| `SKILL.md` | The workflow the agent follows |
| `scripts/fleet-preflight.sh` | Herdr check, free memory, agents and dev servers already running |
| `scripts/fleet-worktree.sh` | One worktree per slice: branch `fleet/<slice>`, shared `node_modules`, copied env files |
| `assets/brief-template.md` | The brief every worker gets |
| `references/repo-notes-template.md` | Template for a repo's `.fleet/NOTES.md` (its traps, commands, isolation needs) |
| `evals/evals.json` | Test prompts used while building the skill |

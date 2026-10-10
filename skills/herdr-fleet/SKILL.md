---
name: herdr-fleet
description: Run a multi-agent coding fleet through Herdr to implement a plan in parallel - split the work into disjoint slices, ask which agent kind and model fills each role, isolate every worker in its own git worktree (and database when tests share one), brief them by file, launch and monitor them, verify their work yourself, integrate, and tear down only our own panes. Use this whenever the user wants to implement a plan, PRD, issue list, design or redesign "with workers", "with the fleet", "in parallel", "with herdr", "spawn agents/workers", "delegate to codex/muse/omp", or asks for the fleet workflow, even if they do not name this skill. Requires running inside a Herdr pane (HERDR_ENV=1).
license: MIT
metadata:
  version: "1.0.0"
  requires: "Herdr (terminal workspace for coding agents) and git"
---

# Herdr fleet

You are the orchestrator. Workers implement; you plan the slices, brief, watch, verify and integrate. The value of a fleet is parallel throughput without the usual parallel failures: workers stomping on each other's files, sharing a test database, reformatting code they do not own, committing on the user's behalf, or exhausting the machine's memory. Every step below exists because one of those happened before.

This skill is the fleet workflow on top of the base `herdr` skill that ships with Herdr. If it is installed, load it first: it owns the CLI mechanics this skill relies on - discovering syntax from `herdr --help` and `herdr <group>` (never bare `herdr`, which opens the TUI), JSON ids from command results, agent states (`idle`, `done`, `blocked`, `unknown`), `agent start` readiness and `agent_not_ready`, `agent prompt` stalls, and pane read sources. When the two disagree on a command detail, the base skill and the installed binary win.

## Working style

- **Align before spending.** For a vague plan, batch every clarifying question into one AskUserQuestion call before slicing; never drip them. A clear, specific plan executes without questions beyond the role choice in section 2.
- **Architecture first.** Settle the shared contracts (types, API shapes, file ownership) before any worker starts. Workers fill in a decided design; they do not make architectural calls.
- **Decide, don't defer.** Briefs state the choice ("use X", "put it in Y"), never "up to you".
- **Measured over assumed.** Verification uses real command output. When a number is an estimate (memory budget, worker count), say so and check it.
- **Report tight.** Updates to the user are short: what changed, what is blocked, what you need from them. At the end, a brief summary of the non-obvious decisions, not a walkthrough. English only.
- **Surgical follow-ups.** A short correction from the user ("change X") becomes a targeted fix note to the owning worker, not a re-run of the slice.

Keep a ledger at `<repo>/.scratch/fleet/<run>/FLEET.local.md` (git-ignored by the `*.local*` rule): slices, owners, pane ids, worktrees, DBs, status, verification results. Update it after every state change. Conversations get compacted and panes outlive them; the ledger is how you (or the next session) know which panes and worktrees are ours.

## 0. Preflight

Run `bash <skill-dir>/scripts/fleet-preflight.sh`. It checks `HERDR_ENV`, memory, existing agents and dev servers. If `HERDR_ENV` is not 1, stop and say you are not inside Herdr - do not drive someone else's session.

Record your own pane id (`$HERDR_PANE_ID`) and the agent list as it is now. Anything already running belongs to someone else. You will never close, prompt or "clean up" a pane you did not create, even an idle one, even to free memory.

## 1. Slice the plan

Read the plan (PRD, issues, canvas, chat). Produce slices that are:

- **Disjoint in files.** Each slice owns an explicit list of files or globs. Two slices may read the same file but only one may write it. Shared files (a barrel, a nav config, a route table, `package.json`) go to one owner, or into a small "integration" slice you do yourself at the end. This is the single most important property: a worker mid-edit breaks every other worker's compile when they share a checkout or a file.
- **Vertical when possible.** A slice that touches UI + API + test for one feature is easier to verify than a "all the CSS" slice.
- **Ordered in waves.** If B needs A's types or API, B is in a later wave. Prefer fewer, larger waves to many dependent ones.

Write the slice table into the ledger, then show it to the user (slice, owner files, wave, done-when) and get a yes before launching anything. A wrong split costs far more than the minute it takes to confirm.

## 2. Ask who fills each role

Agent kinds and models change, and the right choice depends on the task, so ask at the start of every run - once, not per slice. Get the live kind list from `herdr agent` (the `kinds:` line). Use AskUserQuestion with one question per role:

- **Worker** (implements slices): kind + model, e.g. codex with a fast model and `-c model_reasoning_effort="high"`, omp or pi with `--model <provider/model>`, claude.
- **Reviewer** (second opinion on each finished slice, optional): e.g. codex with its strongest model at high effort, or "the orchestrator reviews alone".
- **Max concurrent workers** (memory-bound; see section 6).

Put the user's last-used or saved preference first and mark it "(Recommended)" so the common case is one click. If the user already said which kinds/models to use in this conversation, do not ask again - use that. Mixed setups are fine (UI slices on one kind, backend on another); record the mapping in the ledger.

Native agent flags go after `--` in `herdr agent start`. Codex validates effort values (`none, minimal, low, medium, high, xhigh, max`) and rejects others.

## 3. Isolate every worker

Shared checkouts break each other: a test or typecheck step that compiles the whole tree fails on another worker's half-written file. So each worker gets:

- **Its own git worktree and branch.** `bash <skill-dir>/scripts/fleet-worktree.sh <repo> <slice-name> [base-ref]` creates `../<repo-name>-fleet-<slice>` on branch `fleet/<slice>`, symlinks `node_modules` (and nested ones it finds, such as `api/node_modules`), and copies untracked env files (`.env.local`, `.env`). Record the path in the ledger.
- **Its own database when the test suite writes to a shared one.** Clone the working database (`pg_dump --no-owner --no-acl | psql`) rather than migrating an empty one - fresh migrations usually lack seed fixtures. Pin it into the pane with `herdr pane split ... --env DATABASE_URL=...` so the worker cannot fall back to the shared DB.

Read the repo's own agent docs (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`) and its fleet notes if it keeps any (`.fleet/NOTES.md`): test databases, build commands, files that break when shared. If the repo has none and you learn a trap during the run, offer to write `.fleet/NOTES.md` from `references/repo-notes-template.md`.

## 4. Write the briefs

One brief file per slice at `<repo>/.scratch/fleet/<run>/<slice>.brief.md`, from `assets/brief-template.md`. A worker sees only its brief, so it must carry:

- The goal, the done-when checks, and the exact files it owns. Everything else is read-only.
- The verification commands to run in its own worktree (typecheck, lint read-only, the relevant tests), and the instruction to report their real output.
- The house rules that workers have broken before:
  - No git writes of any kind (no commit, branch, stash, rebase, push). You integrate. Name `git stash` explicitly and give the alternative (`git diff`, `git show HEAD:<file>` for a baseline): workers reach for it to compare lint output against HEAD and break this rule even when it is in bold. Check `git stash list` when verifying.
  - No formatter or linter in write mode (`biome --write`, `--fix`, `prettier -w`, `eslint --fix`): it rewrites files the worker does not own. Read-only checks only.
  - No new dependencies without saying so in the report.
  - The user's code style (imports at the top, one-line comments, ASCII only - no em-dash or box-drawing characters).
  - A memory gate before any heavy job (build, browser, docker, full test suite): wait until `MemAvailable` is at least 2000 MB, and run heavy jobs one at a time.
- Where to write the report: `<slice>.report.md` next to the brief - what changed, commands run with results, anything left undone or uncertain.

## 5. Launch

For each slice in the current wave, up to the concurrency limit:

```bash
herdr pane split --current --direction right --cwd <worktree> [--env KEY=VALUE] --no-focus
# read .result.pane.pane_id from the JSON
herdr agent start <slice-name> --kind <kind> --pane <pane-id> -- <native agent args>
herdr agent prompt <slice-name> "Read and do <absolute path to brief>. Write your report where it says."
```

Name agents `<run>-<slice>` (e.g. `r1-money`), not just the slice: agent names are unique across the whole Herdr server, and another session may already own `money`. Have workers write their report inside their own worktree (e.g. `<worktree>/.scratch/<slice>.report.md`, git-ignored) and copy it to the run folder yourself; some agents refuse to write outside their working directory (codex rejects `--add-dir`). Split right for the first worker, then down inside the worker column, so panes stay usable; check `herdr pane layout --current` if unsure. Send the brief as a path in a one-line prompt: multi-line prompt text gets executed line by line if the agent has exited back to a shell. Record pane id and agent name in the ledger immediately.

**First launch in a new worktree** often stops at the agent's own folder-trust question (codex asks whether to trust the directory), so `agent start` returns `agent_not_ready`. Read the pane; if it is only the trust question for the worktree you just created, accept it (`herdr agent send-keys <name> enter`) and wait for idle. Any other question goes to the user.

**Confirm the prompt landed.** Some agents (codex seen in practice) report ready from `agent start` but drop the first prompt, leaving the pane idle at an empty input. A few seconds after each prompt, check `herdr agent get <name>`: if the status is still `idle` and `herdr agent read <name> --source visible --lines 20` shows no sign of the task, send the same one-line prompt once more. Only then start the background watcher - a watcher on an agent that never started returns immediately and looks like a finished worker.

Write shell commands out literally rather than storing a command in a variable: zsh does not word-split `$CMD`, so `$GIT merge ...` style lines fail.

## 6. Monitor in the background

Do not poll and do not sit in a foreground wait. Right after each prompt, start a background watcher with the Bash tool's `run_in_background: true`, so you are woken when the agent settles and can keep working (writing the next brief, verifying a finished slice) meanwhile:

```bash
herdr agent wait <name> --timeout 3600000; herdr agent get <name>
```

`agent wait` without `--until` returns on idle, done or blocked, which is exactly the set you must act on. One watcher per running agent; start a new one after every new prompt. When a watcher returns, act on the state below. For a long run, `herdr notification show "<slice> needs you" --sound request` tells the user when something is blocked on them; `--sound done` when the whole fleet finishes.

- **blocked:** read the pane (`herdr agent read <name> --source recent-unwrapped --lines 120`). A permission or design question that the brief already answers, you may answer. Anything that changes scope, touches something outside the slice, or is destructive goes to the user first.
- **done/idle:** check that the report exists. An idle agent without a report has stalled or misunderstood; read the pane before re-prompting.
- **Memory:** before launching the next worker or any heavy job, check `MemAvailable`. On a 16 GB machine each idle agent costs roughly 0.3-0.6 GB and a Next build or headless browser several GB; when below 2000 MB, wait for a running worker to finish rather than launching. Never free memory by killing panes that are not ours.

## 7. Verify (you, not the worker)

A worker's report is a claim, not evidence. For each finished slice:

1. `git -C <worktree> status` and `git diff` - read the whole diff. Check it stayed inside its owned files, matches the brief, and follows the style rules. Revert or re-brief anything outside scope.
2. Run the verification commands yourself in the worktree and compare with the report.
3. If a reviewer role was chosen, give it the diff and brief by file and ask for actionable findings only. Weigh them; do not apply blindly.
4. Record pass/fail and evidence in the ledger. Send fixes back to the same worker (same pane, new one-line prompt pointing at a short fix note) rather than starting a new one.

## 8. Integrate

On an integration branch in the main checkout, merge or cherry-pick each verified slice branch in wave order, then do the integration slice (shared files) yourself. Run the full verification once on the result. Report real numbers, including pre-existing failures, and say which are pre-existing.

The user decides about commits. If the repo signs commits or its CI rejects agent attribution trailers (Co-Authored-By and similar), follow that; never add trailers the user has not asked for. Stage and hand over a commit message file unless the user told you to commit, and ask before `--no-gpg-sign` each time. Never push unless asked.

## 9. Pane lifecycle

Panes and agents are cheap to start but carry context, memory and the user's screen space. Treat each one as owned, tracked and deliberately ended.

**Own.** A pane is ours only if this run created it and it is in the ledger (pane id, agent name, worktree, slice). Everything else, including idle agents from other projects or earlier sessions, is someone else's: never prompt, send keys to, rename or close it, even to free memory.

**Reuse or replace.** When the next piece of work comes up:

- **Same task or a follow-up** (a fix from verification, a reviewer finding, the user's correction, the next step of the same slice): reuse the agent that did it. It already holds the files and decisions in memory; send a one-line prompt pointing at a short fix note.
- **A new task that does not need the old agent's memory:** close the old agent's pane (once its slice is verified) and spawn a fresh one. Stale context costs tokens, drifts the new task toward the old one, and the idle agent still holds memory.
- **A new task in a different worktree:** always a fresh agent in a pane whose `--cwd` and `--env` match the new worktree; never point an old pane at a new worktree.

**Layout.** Split right for the first worker, then down inside the worker column; at most about four visible worker panes. Use `--no-focus` so the user's focus stays put.

**End.** Keep workers alive until the whole queue is verified and integrated (the reuse rule above depends on it), except a worker you are replacing under the reuse rule. When a pane must close: confirm its slice is verified and its report saved, then `herdr pane close <id>` and mark it closed in the ledger. If a session was interrupted, rebuild ownership from the ledger before closing anything.

## 10. Tear down - only when every slice is done

- Close only the panes in your ledger that are still open (`herdr pane close <id>`), never others.
- Remove the worktrees you created (`git worktree remove <path>`; `git branch -D fleet/<slice>` only after its commits are integrated) and drop the cloned databases.
- Mark the ledger closed and give the user the summary: slices, verification results, what is staged, anything left open.

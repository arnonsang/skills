# Slice: <slice-name>

You are one worker in a fleet. Other workers are editing other files in other worktrees at the same time. Stay inside your slice.

## Goal

<one paragraph: what to build and why, in the project's own words>

## You own (may create or edit)

- <path or glob>
- <path or glob>

Everything else is read-only. If you need a change outside this list, stop and say so in your report instead of making it.

## Context to read first

- <spec / design board / issue path>
- <existing file that shows the pattern to follow>

## Done when

- [ ] <observable behavior>
- [ ] <test or check that passes>

## Verify in this worktree (report the real output)

```
<typecheck command>
<read-only lint command on your files>
<the tests for this slice>
```

## House rules

Defaults that prevented real fleet accidents. Adapt the style line to the project's AGENTS.md or CONTRIBUTING.md.


- No git writes: no commit, branch, stash, rebase, reset, push. The orchestrator integrates.
- No formatter or linter in write mode (`biome --write`, `--fix`, `prettier -w`, `eslint --fix`). They rewrite files you do not own. Read-only checks only; fix formatting by hand in your own files.
- No new dependencies unless the goal needs one; if you add one, say so in the report.
- Code style: <the project's rules, e.g. imports at the top, comments that explain why, ASCII only>; match the surrounding code.
- Before any heavy job (build, browser, docker, full test suite): wait until `awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo` is at least 2000, and run one heavy job at a time.
- Do not start or stop dev servers, docker containers, or other agents.

## Report

Write `.scratch/<slice-name>.report.md` inside your worktree (it is git-ignored; the orchestrator collects it) with:

1. What changed (files, one line each).
2. Each verify command and its actual result (paste the summary lines).
3. Anything not done, uncertain, or outside your files that needs the orchestrator.

Then stop.

<h1 align="center">iamickdev skills</h1>
<p align="center">Agent skills I use every day, packaged for the <a href="https://www.npmjs.com/package/skills"><code>skills</code></a> CLI.<br/>Works with Claude Code, Codex, Cursor and the other agents the CLI supports.</p>

<p align="center">
  <a href="https://github.com/arnonsang"><img src="https://img.shields.io/badge/GitHub-arnonsang-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub arnonsang"/></a>
  <a href="https://www.iamickdev.com"><img src="https://img.shields.io/badge/Web-iamickdev.com-eb147c?style=for-the-badge" alt="iamickdev.com"/></a>
  <img src="https://img.shields.io/badge/license-MIT-6a32de?style=for-the-badge" alt="MIT license"/>
</p>

---

## Skills

| Skill | What it does |
|---|---|
| [`herdr-fleet`](skills/herdr-fleet/SKILL.md) | Runs a parallel coding fleet through Herdr. It splits a plan into slices that own separate files, gives every worker its own git worktree (and test database), briefs workers by file, watches them in the background, verifies their work itself, integrates in order, and closes only the panes it created. |

## Install

```bash
# every skill in this repo
npx skills add arnonsang/skills

# just one
npx skills add arnonsang/skills --skill herdr-fleet

# see what is inside first
npx skills add arnonsang/skills --list
```

## The story behind `herdr-fleet`

I build a production AI platform mostly by orchestrating coding agents: one agent plans and reviews while several others implement in parallel, each in its own pane in Herdr, a terminal workspace for coding agents. It is fast when it works. In the early runs it often did not.

Every rule in the skill exists because something went wrong:

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

### Does it help?

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

## Layout

```
skills/
  <skill-name>/
    SKILL.md        # frontmatter (name, description) and instructions
    scripts/        # helpers the skill runs
    assets/         # templates the skill copies
    references/     # docs loaded on demand
    evals/          # prompts used to test the skill while building it
```

## About

I'm Arnon Sang-ngern ([@arnonsang](https://github.com/arnonsang), iamickdev), a developer who likes building tools that make daily work easier and more elegant. More of my projects are at [iamickdev.com/projects](https://www.iamickdev.com/projects). Reach me at **contact@iamickdev.com**.

Issues and pull requests are welcome.

## License

[MIT](LICENSE)

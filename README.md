# Skills

Agent skills for Claude Code, Codex, Cursor and the other agents supported by the [`skills`](https://www.npmjs.com/package/skills) CLI.

| Skill | What it does |
|---|---|
| [`herdr-fleet`](skills/herdr-fleet/SKILL.md) | Runs a parallel coding fleet through Herdr: disjoint slices, one git worktree (and test database) per worker, file briefs, background status watching, orchestrator-side verification, integration, and safe pane teardown. |

## Install

```bash
# every skill in this repo
npx skills add <owner>/skills

# one skill
npx skills add <owner>/skills --skill herdr-fleet

# from a local checkout
npx skills add ./path/to/skills
```

Replace `<owner>` with the GitHub account that hosts this repo.

## Layout

```
skills/
  <skill-name>/
    SKILL.md        # frontmatter (name, description) + instructions
    scripts/        # helpers the skill runs
    assets/         # templates the skill copies
    references/     # docs loaded on demand
    evals/          # test prompts used while developing the skill
```

## License

MIT

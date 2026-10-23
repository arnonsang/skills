<h1 align="center">iamickdev skills</h1>
<p align="center">Agent skills I use every day, packaged for the <a href="https://www.npmjs.com/package/skills"><code>skills</code></a> CLI.<br/>Works with Claude Code, Codex, Cursor and the other agents the CLI supports.</p>

<p align="center">
  <a href="https://github.com/arnonsang"><img src="https://img.shields.io/badge/GitHub-arnonsang-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub arnonsang"/></a>
  <a href="https://www.iamickdev.com"><img src="https://img.shields.io/badge/Web-iamickdev.com-eb147c?style=for-the-badge" alt="iamickdev.com"/></a>
  <img src="https://img.shields.io/badge/license-MIT-6a32de?style=for-the-badge" alt="MIT license"/>
</p>

---

## Skills

| Skill | What it does | Details |
|---|---|---|
| [`herdr-fleet`](skills/herdr-fleet/) | Runs a parallel coding fleet through Herdr: separate slices, one worktree per worker, background watching, orchestrator-side verification, safe pane teardown. | [README](skills/herdr-fleet/README.md) |
| [`second-look`](skills/second-look/) | Reviews UI that looks machine-made, fixes it with the project's own tokens, proves the fix in both themes and three widths, and leaves a Don'ts list so it stays fixed. | [README](skills/second-look/README.md) |

Each skill's folder has its own README with what it does, why it exists, and how it was tested.

## Install

```bash
# every skill in this repo
npx skills add arnonsang/skills

# one skill
npx skills add arnonsang/skills --skill <skill-name>

# list what is inside first
npx skills add arnonsang/skills --list
```

## Adding a skill

```
skills/
  <skill-name>/
    SKILL.md        # required: frontmatter (name, description) and instructions
    README.md       # what it does, the story behind it, how it was tested
    scripts/        # optional helpers the skill runs
    assets/         # optional templates the skill copies
    references/     # optional docs loaded on demand
    evals/          # optional test prompts
```

1. Create `skills/<skill-name>/SKILL.md`. The frontmatter `name` must match the folder name, and the `description` says what the skill does and when an agent should use it.
2. Add `README.md` next to it, using the same sections as the existing skills.
3. Keep it free of private details: no internal hostnames, credentials, customer data or personal paths.
4. Check the CLI finds it: `npx skills add . --list`.
5. Add a row to the Skills table above.

## About

I'm Arnon Sang-ngern ([@arnonsang](https://github.com/arnonsang), iamickdev), a developer who likes building tools that make daily work easier and more elegant. More of my projects are at [iamickdev.com/projects](https://www.iamickdev.com/projects). Reach me at **contact@iamickdev.com**.

Issues and pull requests are welcome.

## License

[MIT](LICENSE)

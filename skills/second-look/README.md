# second-look

Give UI a second look before it ships: find the habits that make it read as machine-made, fix them with the project's own tokens, prove the fix in both themes and at three widths, and leave the project a Don'ts list so agents stop bringing them back.

```bash
npx skills add arnonsang/skills --skill second-look
```

## What it does

1. **Grounds itself** in the project's tokens, design system page or `DESIGN.md`, and decides the register: brand surfaces (landing pages, decks) get more expression than product surfaces (apps, dashboards).
2. **Detects** with a headless probe: a browser lint for the patterns a script can measure, JS errors, horizontal overflow, and text that disappears on hover, in light and dark at 320, 768 and 1440 px. Then reads the page against a catalog for the patterns only a reviewer can judge.
3. **Triages** false positives (CSS `--` is not an em dash, a quoted buzzword in a style guide, the brand's own gradient, a deliberate zero gap) and marks them instead of weakening the rules.
4. **Proposes, then fixes** with existing tokens. No new raw colors or fonts.
5. **Proves** the fix: the same probe again, contrast for every new color pair, and any new check run against the old version to show it fires.
6. **Encodes the Don'ts** into `AGENTS.md`, `DESIGN.md` or the design system page: the pattern, what to do instead in the project's token names, and how it is checked.

It also covers slide decks and infographics, where the tells are different: the same centered-title-over-three-cards layout on every slide, gradient backgrounds, rainbow palettes, status colors used as chart series.

## The story

I maintain a design system that agents use to build product UI. A review against the usual "AI slop" catalogs found that the system itself was teaching the habits: gradient text in the hero, an eyebrow above every section, colored side stripes on alerts, a bounce easing token, em dashes in the copy. Agents copied all of it.

Fixing the page was the easy half. The patterns came back in the next generated screen, because nothing told the agents not to use them and nothing measured them. This skill is the process that worked:

- **A lint that runs in the page,** because most of these patterns are computed styles, not source text. A grep for "gradient" finds the brand mark; the lint finds gradient-clipped text.
- **Triage before fixing.** The first detector run reported 2,161 em dashes. They were CSS custom properties. Half the early findings were noise like this, and "fixing" them would have broken the system.
- **Both themes, three widths, forced hover.** A secondary button whose hover painted the background but not the text passed every screenshot and failed for every user who moved a mouse over it.
- **A check must fail on the old version.** One lint rule contained the very character it banned and flagged itself; another passed everything because its selector never matched.
- **A Don'ts list in the files agents read first,** with the replacement in the project's own token names, so "don't" always comes with "do this instead".

## Does it help?

Measured on three tasks with Sonnet, with and without the skill, graded by script:

| | With skill | Without |
|---|---|---|
| Clean up a generated-looking landing page | 9 / 9 checks | 8 / 9 |
| Review a dashboard and write a Don'ts list | 10 / 10 | 8 / 10 |
| Build an investor deck from a CSV | 9 / 9 | 8 / 9 |
| Time per run (average) | 120 s | 66 s |

The checks cover lint findings in light and dark at 320 and 1440 px, overflow, text hidden on hover, raw colors outside the tokens, buzzwords and placeholders, status colors in charts, and whether the Don'ts list names the project's tokens and how to check them.

Sonnet does well on its own, so the gap in checks is small. The larger difference is verification: every run with the skill tested both themes, three widths and forced hover; no run without it tested the dark theme, and one never opened a browser. The lint check uses the skill's own lint, so it favors the skill by construction.

The test prompts are in [`evals/evals.json`](evals/evals.json), with deliberately generated-looking fixtures in `evals/files/` (they contain buzzwords and placeholder names on purpose).

## Requirements

- Node 18 or newer and a Chromium for the probe: `CHROME_BIN`, Playwright's (`npx playwright install chromium`), or `chromium` / `google-chrome` on PATH.
- Python 3 for the contrast script.
- No npm dependencies.

## Files

| Path | Purpose |
|---|---|
| `SKILL.md` | The workflow the agent follows |
| `scripts/probe.mjs` | Headless probe: lint, JS errors, overflow and `--hover` contrast per width and theme |
| `scripts/second-look-lint.js` | The browser lint; paste into DevTools, or let the probe inject it |
| `scripts/contrast.py` | WCAG contrast for one pair, a pairs file, or the worst point on a gradient |
| `references/donts.md` | The catalog: pattern, why it reads as generated, what to do instead, how it is checked |
| `references/principles.md` | The reasoning behind the catalog, for patterns it does not list |
| `references/verification.md` | False positives, the prove loop, and traps that make a fix look done |
| `references/formats.md` | Slides and infographics |
| `evals/` | Test prompts and fixtures |

# pixel-proof

Verify UI work with evidence. A parameterized Playwright gate runs your lints, axe and an overflow check on every page in light and dark; a separate worker drives the browser and brings screenshots; fidelity and fresh-install checks close the gaps; and the orchestrator re-runs everything instead of trusting a worker's "done".

```bash
npx skills add arnonsang/skills --skill pixel-proof
```

## What it does

1. **Picks the layers** the work needs: the gate (every change), interaction QA (anything with controls or overlays), fidelity (a page rebuilt from a reference), install test (items consumers install).
2. **Runs the gate** with `scripts/check_pages.py`: each page, light and dark, at 320 and 1440, through your custom lints, axe-core (pinned, WCAG 2.0 to 2.2 A/AA) and a horizontal-overflow check. Zero findings is the only pass.
3. **Reads lint rules from one source:** a `<pre id>` in your reference page (`--lint-from-html FILE:ID`) or a `.js` file (`--lint-file`), so rules are never copied around.
4. **Briefs a QA worker** (`references/qa-worker-brief.md`) to drive every control with `playwright-cli`: keyboard, open states, disabled, loading and error states, console errors, ARIA snapshot, screenshots named `<page>-<state>-<theme>-<width>.png`, and a report with a table, numbered issues and "not tested and why".
5. **Compares with the reference** side by side at 1440 in both themes and separates real differences from ones the owner removed on purpose.
6. **Installs from a fresh app** (`references/install-test.md`): init from the style URL, add every item, build, axe the installed app.
7. **Keeps the orchestrator honest** (`references/orchestrator-rules.md`): re-run the checks yourself, never rebuild a server a QA worker uses, serialize heavy jobs, start servers so the pid is real.

## The story

I build a design system and its component registry by orchestrating coding agents. Workers are fast and cheerful, and they report "done" long before a page is. Every rule here comes from something that got past a report:

- **A worker's whole demo page did nothing.** The page script had never been ported, so tabs, switches and the command palette were inert. Static checks passed; a browser pass found it.
- **A design lint flagged a bouncing easing the source page passed.** A pasted copy of the exported tokens had drifted from the source. Generated copies now come from the export in the build.
- **axe failed a button whose aria-label did not contain its visible text.** Labels must include the visible words.
- **A generated chart had `aria-labeledby`.** One typo, one critical axe failure, found on the first full run.
- **A preview crashed the static build** because a component with an `onClick` was missing `"use client"`.
- **A 320px overflow came from one unbreakable line of code** in an install command.
- **A build hung for ten minutes with no process running.** A background file server had inherited the build lock and kept it. Servers are now started so `$!` is the real pid, and the rules say how to find a lock holder.
- **A rebuild would have killed a QA worker's server** mid-run. Edit while it runs, build after the report.
- **zsh passed 36 item names as one string** to the install command. Use arrays or a paths file.
- **Side-by-side themes did not work** because tokens scoped on `:root` do not re-scope on a nested element. Each theme gets its own iframe.

Static checkers cannot see open dialogs, drawers, menus or tooltips at all, so screenshots of those states are part of the evidence, not decoration.

## Does it help?

Honest status: this skill was distilled from one real build, not A/B benchmarked yet. On that build the gate and the QA pass caught each problem above before it merged, and the final run of the gate reported 0 findings across 300 page, theme and width combinations. The test prompts in [`evals/evals.json`](evals/evals.json) are the ones I will use for with-skill versus baseline runs.

## Requirements

- Python 3 with Playwright (`pip install playwright && playwright install chromium`) for the gate.
- [`playwright-cli`](https://www.npmjs.com/package/@playwright/cli) for the QA worker pass.
- A built and served copy of the site (production build, not the dev server).
- For parallel QA: Herdr and the `herdr-fleet` skill are a natural fit but not required.
- Works well beside [`second-look`](../second-look/): add `--lint-file <second-look>/scripts/second-look-lint.js` and its taste lint runs in the same gate.

## Files

| Path | Purpose |
|---|---|
| `SKILL.md` | The workflow and layer selection |
| `scripts/check_pages.py` | The gate: lints, axe, overflow, light and dark, 320 and 1440 |
| `references/qa-worker-brief.md` | Fill-in brief for the browser QA worker |
| `references/orchestrator-rules.md` | Verification rules, server and lock handling |
| `references/pitfalls.md` | Failures that cost time, with the fix for each |
| `references/install-test.md` | Fresh-app install test for registry items |
| `references/example-setup.md` | A worked setup: design-system docs site plus component registry |
| `evals/evals.json` | Test prompts for with-skill versus baseline runs |

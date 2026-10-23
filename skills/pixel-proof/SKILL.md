---
name: pixel-proof
description: Verify UI work with evidence instead of claims - automated per-page gate (custom lints, axe, overflow in light and dark at 320 and 1440), a separate-worker browser QA pass with screenshots, fidelity check against a reference page, and a fresh-app install test for registry items. Use whenever the user asks to verify, QA, inspect, review or "drive through" a site, design system, component library or docs page, says "make sure everything works", asks for screenshots to review, or when a worker reports a UI slice done and you must decide whether to trust it. Use it even if they never say "QA".
license: MIT
metadata:
  version: "1.0.0"
  requires: "Python 3 with Playwright and Chromium; playwright-cli for the QA pass"
---

# pixel-proof

Workers report UI as done long before it is. This skill turns "looks fine" into evidence: a script that fails loudly, a browser pass that sees what static checks cannot, and a rule that the orchestrator re-runs everything itself.

## Pick the layers you need

| Layer | When | How |
|---|---|---|
| 1. Gate | every page, every change | `scripts/check_pages.py` |
| 2. Interaction QA | anything with controls, overlays or state | worker with `playwright-cli`, brief in `references/qa-worker-brief.md` |
| 3. Fidelity | page rebuilt from a reference | side by side at 1440, both themes |
| 4. Install test | registry or library items consumers install | fresh app, `references/install-test.md` |

Run 1 after every slice. Run 2 and 3 before calling a phase done. Run 4 when items ship.

## Layer 1: the gate

```bash
python3 scripts/check_pages.py --base http://127.0.0.1:PORT --paths-file paths.txt \
  --lint-from-html reference/page.html:exp-gap-lint \
  --lint-from-html reference/page.html:exp-lint
```

It loads each path in light and dark at 320 and 1440, runs your lints, axe-core (pinned, wcag2a/aa/21a/21aa/22aa) and a horizontal-overflow check, and prints one finding per line. Zero findings is the only passing result. Why each choice matters:
- Lints are read from the reference page (`--lint-from-html FILE:ID`) or a `.js` file (`--lint-file`), so the project keeps one source for its rules. Typical lints: gap (every flex/grid with 2+ children sets a gap), gradient border-box, design rules (eyebrow/icon repeat, uppercase, bounce, side stripe).
- It waits for `load`, not `networkidle`: framework link prefetching keeps the network busy forever and the run hangs. Timeouts and 404s are reported as findings, never crashes.
- `--theme-mode class` for apps that toggle `.dark`; default sets `data-theme` on `<html>`.

The `second-look` skill (if installed) ships a ready taste lint: add `--lint-file <second-look>/scripts/second-look-lint.js` and its findings join the same run. Use second-look to review and fix how the UI looks; use pixel-proof to prove it works.

Build the production bundle and serve it; do not check the dev server (dev overlays and HMR add noise).

## Layer 2: interaction QA by a separate worker

Static checks cannot see open states, keyboard behavior or focus return. Give a worker `references/qa-worker-brief.md` (fill in the site, components, port). It drives every control with `playwright-cli`, screenshots each state as `<page>-<state>-<theme>-<width>.png`, and writes a report: table, numbered issues (severity, steps, expected, actual), and "not tested and why". Native `<dialog>`, Radix portals and tooltips are invisible to the gate, so the screenshots are the evidence for them. Read the screenshots yourself.

## Layer 3: fidelity

Open the original and the rebuild at 1440 in both themes and list real differences by region (header, nav, hero, section heads, components). Drop differences the owner removed on purpose, and say which ones you dropped.

## Orchestrator rules

Read `references/orchestrator-rules.md` before running a fleet or a QA worker. The short version: never trust a report, re-run the checks yourself; never rebuild a server a QA worker is using; serialize heavy jobs; start servers with `node` directly so `$!` is the real pid.

## Pitfalls

`references/pitfalls.md` lists failures that cost hours (stale generated CSS, aria-label vs visible text, client components, zsh word splitting, nested theme scoping, leaked file locks). Skim it when a check fails in a way that makes no sense.

## Report back

Say what you ran with real numbers, what you saw in screenshots, what you did not test, and which findings are upstream and unfixable by you. A check you did not run is not a pass. `references/example-setup.md` shows a full project setup.

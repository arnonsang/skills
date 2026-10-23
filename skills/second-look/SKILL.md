---
name: second-look
description: Review and fix UI that looks machine-made, then leave the project a Don'ts list so it stays fixed. Detects the common tells of generated design (gradient text, decorative gradients and glows, colored side-stripe cards, eyebrow labels above every section, icon tiles on every heading, hero-metric rows, identical card grids, bounce easing, buzzword copy, em dashes, placeholder names, hover states that hide text, children with no gap), triages false positives, proposes fixes for approval, applies them with the project's own tokens, proves them with a headless probe in both themes and three widths, and writes the rules into AGENTS.md, DESIGN.md or the design system page. Also covers slide decks and infographics. Use this whenever the user says a page looks AI-generated, generic, templated, "slop", "too vibe-coded", or "like every other SaaS site", asks to de-slop or clean up a design, wants a design review or audit of a landing page, dashboard, design system, deck or chart page, wants a Don'ts or anti-patterns section for agents, or asks to check generated UI before shipping, even if they never say "slop".
license: MIT
metadata:
  version: "1.0.0"
  requires: "Node 18+ and Chromium for the probe (Playwright's or system); Python 3 for contrast"
---

# second-look

Generated UI has tells, the way a poker player does: small habits that each look fine and together say
"nobody decided this". This skill finds them, fixes them with the project's own design tokens, proves the
fix with measurements, and writes the rules down so the next agent does not bring them back.

It is a taste review with evidence. For a full functional QA gate (axe, interaction passes, fidelity
against a reference), use `pixel-proof` if it is installed; the two compose.

## Workflow

Do these in order. The user confirms once, at step 4; everything before is read-only.

### 1. Ground yourself

Find the design source before judging anything: tokens (CSS custom properties, `tokens.json`, Tailwind
theme), a design system page, `DESIGN.md`, `AGENTS.md`, brand guidelines. Note:

- **Register.** Is this a brand surface (landing page, marketing, deck) or a product surface (app,
  dashboard, docs)? Brand surfaces earn more expression: a gradient that is the brand mark, a bolder
  type scale. Product surfaces earn less. Judge each page by its register, and say which one you used.
- **What is intentional.** The brand gradient, a mascot, a signature animation. Those are not slop just
  because a catalog lists the pattern; they are slop when they spread beyond their job.

If there are no tokens at all, say so: the first fix may be to extract a small token set, and every
other fix should use it.

### 2. Detect

Run the probe on every page in scope (local HTML, or a built page):

```bash
node <skill>/scripts/probe.mjs page.html --hover            # 320,768,1440 x light,dark
node <skill>/scripts/probe.mjs page.html --widths 390 --themes light --json
```

For a page behind a dev server or login, paste `scripts/second-look-lint.js` into DevTools instead. Then
read the page yourself against `references/donts.md`: about half the catalog is "review", things a
script cannot judge (identical card grids, hero-metric rows, vague buttons, a modal as the first choice).
For anything the catalog does not name, apply the tests in `references/principles.md`.
Save the probe output; it is your "before".

### 3. Triage

Separate real findings from noise before you show anything. `references/verification.md` lists the known
false positives (CSS `--` is not an em dash, a quoted buzzword in a style guide, a critically damped
spring is not a bounce, the brand gradient, intentional zero-gap groups). Mark intentional regions
rather than weakening a rule:

- `data-second-look-demo`: a region that shows a pattern on purpose (component demos, an animation gallery)
- `data-second-look-dont`: a region that quotes bad copy as an example
- `data-brand-gradient`: the brand mark or the one hero CTA
- `data-gap-ok`: a deliberate zero gap (segmented control, joined button group)

### 4. Propose and confirm

Show the user a short table: finding, where, why it reads as generated, the proposed fix in their token
names. Group by severity: things that break (contrast, hidden content, overflow) first, then the
strongest tells, then polish. Ask about decisions that are theirs: keep a signature animation or not,
which of three visual effects stays, whether to fix by renaming tokens or by adding aliases (aliases keep
existing consumers working; prefer them when the system is already published).

If the project has a "draft first" habit (a `*.draft.html` beside the live file, a branch, a PR), write
there, not over the live file.

### 5. Fix

Use existing tokens. A fix that introduces a raw hex value or a new font has moved the problem, not
solved it. Typical moves:

- gradient text or decorative gradient -> solid `text` / `accent-text` / `surface`
- side stripe -> full outline, soft tint, or leading icon
- repeated eyebrow or heading icon -> delete it; let the heading and navigation carry structure
- hero-metric row -> one sentence with figures and a source, or one stat with a comparison
- card grid of non-objects -> list or table
- bounce -> ease-out to enter, ease-in to leave
- buzzwords and em dashes -> specific verb and number; commas, colons, full stops
- hover hides text -> set both `color` and `background` in every state
- sibling margins -> `gap` from the spacing scale

Do not touch what the user chose to keep in step 4.

### 6. Prove

Re-run the probe with the same arguments. Every "before" failure must be gone and nothing new may
appear, in both themes, at every width. Recompute contrast for each new color pair with
`scripts/contrast.py` (4.5 text, 3 for large text and non-text). If you added or changed a lint rule,
run it on the old version too and confirm it fires; a rule that passes everything proves nothing.
`references/verification.md` lists the traps that make a fix look done when it is not.

### 7. Encode the Don'ts

Leave the project a Don'ts list so agents stop reintroducing the patterns. Three columns: Don't, Do
instead (with the project's token names), Check (`lint: rule` or `review`). Put it where agents read
first: a Don'ts section in the design system page, `DESIGN.md`, and a short pointer in `AGENTS.md` or
`CLAUDE.md` that says to run the lint before calling UI done. Copy `scripts/second-look-lint.js` into the
project if they want the check to travel with the code. Only list patterns that apply to this project.

## Slides and infographics

Decks and chart pages have their own tells (centered-title-over-three-cards slides, gradient backgrounds
on every slide, rainbow palettes, status colors as series, charts without a source or table). Read
`references/formats.md` when the work includes either; it gives layouts, a palette method and checks.

## Report

End with: register used, findings fixed (count by group), findings kept on purpose and why, probe result
after (pass/fail per theme and width), new contrast pairs with ratios, where the Don'ts list now lives,
and anything you could not verify (a theme switched by a class the probe does not set, copy in a
language you cannot judge).

## Files

- `scripts/probe.mjs`: headless probe (lint, JS errors, overflow, `--hover` contrast) per width and theme
- `scripts/second-look-lint.js`: the browser lint; paste into DevTools or let the probe inject it
- `scripts/contrast.py`: WCAG ratios, pairs files, worst point on a gradient
- `references/donts.md`: the catalog with why, do-instead and check for every pattern
- `references/verification.md`: false positives, the prove loop, traps
- `references/formats.md`: slides and infographics
- `references/principles.md`: the reasoning behind the catalog; use it to judge patterns the catalog does not list

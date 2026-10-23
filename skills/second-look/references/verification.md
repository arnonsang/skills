# Proving the fix

A finding is fixed when a measurement says so, not when the code looks right. This file covers the
tools and the traps that make a fix look done when it is not.

## Tools

- `node scripts/probe.mjs page.html [--widths 320,768,1440] [--themes light,dark] [--hover] [--json]`
  Loads the page in headless Chromium for each width and theme and reports lint findings, JS errors
  and horizontal overflow. `--hover` forces every `:hover` rule on and checks button and tab text
  contrast. Exit code 1 on any failure. It writes a temporary copy next to the page so relative
  URLs resolve, and deletes it afterwards.
  Chromium comes from `CHROME_BIN`, the Playwright cache (`npx playwright install chromium`), or
  `chromium` / `google-chrome` on PATH.
- `scripts/second-look-lint.js` alone: paste into DevTools on any page, live or local. Prints a table.
  Use this for pages that need a login or a dev server.
- `python3 scripts/contrast.py FG BG [MIN]`, `--pairs pairs.json`, `--gradient A B TEXT`.
  WCAG 2 ratios; translucent colors are composited first. Text needs 4.5, large text and non-text
  (borders, icons, focus rings) need 3.
- Themes: the probe sets `data-theme` on `<html>` and `color-scheme`. If the project switches themes
  another way (a `.dark` class, a media query only), say so in the report and test it by hand.

## The loop

1. Run the probe on the original and save the output. This is the "before".
2. Fix.
3. Run it again at the same widths and themes. Every "before" failure must be gone and nothing new
   may appear.
4. Prove the check works: if you wrote or changed a lint rule, it must flag the old version. A rule
   that passes everything proves nothing.
5. Recompute contrast for every new color pair you introduced, both themes.

## Known false positives (triage, do not "fix")

- CSS custom properties: `--` in source is not an em dash. The lint reads visible text only.
- A buzzword quoted as an example of what not to write (a Don'ts table, a style guide). Mark the region
  `data-second-look-dont` or `data-second-look-demo`.
- A critically damped spring (`cubic-bezier(0.16, 1, 0.3, 1)` and similar) has no overshoot; only
  control-point y values outside 0..1 overshoot.
- Gradients that are the brand mark (logo, the one hero CTA). Mark with `data-brand-gradient`.
- Zero-gap containers on purpose (segmented controls, button groups with shared borders). Mark with
  `data-gap-ok`.
- `infinite-loop` is info only: spinners and live indicators inside `aria-busy` regions are fine.

## Traps that make a fix look done

- **Gradient behind a transparent border.** The background repeats in the border box and paints a
  seam. Fix with `background-origin: border-box; background-clip: border-box`.
- **Unprefixed custom property inside an inline style.** `var(--gradient-to-br, 135deg)` silently
  falls back when the real token is `--brand-gradient-to-br`. Grep for every `var(--` in the change and
  confirm the token exists.
- **Component `display` overriding `[hidden]`.** `.panel { display: grid }` beats the UA `[hidden]`
  rule. Add `[hidden] { display: none !important }` or scope the display rule.
- **Borders shrink container-query width.** A 1px border on a `container-type: inline-size` element
  changes the width your `cqw` units see; text sized in `cqw` drifts.
- **Hover changes the background but not the text.** Base `:hover` rules (`a:hover`, `button:hover`)
  can repaint the background while text keeps its old color. Run the probe with `--hover`.
- **A lint that contains the character it bans.** A copy rule with a literal em dash in its source
  flags itself when pasted into a page. Write such characters as escapes (`\u2014`).
- **Screenshots at one width.** Overflow and wrapping bugs live at 320px and around breakpoints. Test
  320, 768 and 1440 at minimum.

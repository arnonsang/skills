# QA worker brief template

Copy, fill the angle brackets, save as `<run>/qa.brief.md`, and prompt the worker with the path.

---
# Brief: qa (read-only)

Goal: with the `playwright-cli` command (`playwright-cli --help`, session `-s=qa`), exercise <what> in a real browser, screenshot the states, write a review report. You change NO source files.

Site (already running, do not start, stop or rebuild it): <http://127.0.0.1:PORT>. Pages: <list or pattern>.
Screenshots: <abs dir>/shots/ named `<page>-<state>-<theme>-<width>.png` (ASCII). Report: <abs path>.

For every page or component, in light and dark at 1440 and 320:
1. Rest-state screenshot.
2. Every control: hover, keyboard focus (Tab) with a visible focus ring, pressed, checked or selected, open (menu, select, dialog, drawer, tooltip on hover and focus, accordion, toast), disabled (aria-disabled blocks activation), loading (aria-busy), error (aria-invalid), sorted (aria-sort), copy feedback, send, streaming indicator. Screenshot each changed state.
3. Keyboard: arrows, Home/End (tabs, radios, segmented control, slider), type-ahead and Esc returning focus to the trigger (menu), focus trap and focus return (dialog, drawer), Enter/Space (accordion, switch).
4. `playwright-cli console` errors and warnings; `document.documentElement.scrollWidth > innerWidth`; clipped text at 320.
5. `playwright-cli snapshot` ARIA spot check: roles, accessible names (icon buttons have labels), states that actually change.

Report: a table (page, themes/widths, ok or issue, screenshot names); numbered Issues (page, steps, expected, actual, severity blocker/major/minor, screenshot); "Not tested and why". Report only what you saw. If reference behavior matters, compare with <reference page>.

Rules: no git writes, no edits besides shots and report, no installs, do not touch other panes or servers. ASCII only.
---

Tips: opencode workers need an extra Enter after the first prompt and report `idle` while working, so watch the report file, not agent status. omp workers need a full model id. Tell the worker to treat headless lazy-load image probes as unreliable and confirm with a screenshot.

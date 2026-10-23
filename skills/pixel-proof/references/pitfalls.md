# Pitfalls that cost time

- **Stale generated CSS.** Copies of exported CSS (tokens, tailwind map) drift from the source page. Symptom: a design lint flags something the source page passes (old easing overshoot, missing tokens). Generate the copies from the source exports in the build, never paste once.
- **aria-label must contain the visible text** (axe `label-content-name-mismatch`). An icon-plus-text button labelled "Search sections" fails when the visible text is "Search" plus a shortcut; use "Search <shortcut>" or drop the label.
- **Handlers and hooks need `"use client"`.** A component with `onClick` on a host element or `useId` prerenders fine in a client tree but fails a static server page with "Event handlers cannot be passed to Client Component props".
- **Native `<dialog>`, Radix portals, tooltips, toasts** are closed or absent in a static check. Screenshot their open states in the browser.
- **Side-by-side themes.** If tokens are scoped on `:root`, a nested `data-theme` element does not re-scope. Render each theme in its own iframe (a preview route that sets `data-theme` on its own `<html>`).
- **zsh does not word-split variables.** `for i in $LIST` and `cmd $ITEMS` pass one string. Use `${=ITEMS}`, an array, or write a paths file and use `--paths-file`.
- **Hash anchors across pages.** When one reference page is split into many routes, links like `#c-table` die. Rewrite anchors to the page that owns the id.
- **One script for many sections.** A monolithic page script that assumes every section exists throws on the first missing element and kills the rest. Wrap each block in try/catch, and drop blocks that depend on page chrome.
- **Unwrapped section fragments** lose the wrapper's classes (hero, sec). Keep the outer element when extracting.
- **Headless image probes** (`img.complete`) report false negatives for lazy images; confirm with a screenshot.
- **Install test ordering.** `shadcn init` may already add a stock component with the same name; add the custom one with `--overwrite`.
- **npm `ignore-scripts=true`** disables `pre*` hooks, so a build that relies on `prebuild` silently skips it. Call steps explicitly from the script.

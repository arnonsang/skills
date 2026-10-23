# Example setup: a design-system docs site with a component registry

- A reference page holds the lint sources as `<pre id="lint-gap">`, `<pre id="lint-gradient">` and `<pre id="lint-rules">`; the rules lint checks gap, gradient border, side stripe, repeated eyebrows and heading icons, repeated uppercase labels, bounce easing, layout transitions and banned copy.
- Gate: `python3 scripts/check_pages.py --base http://127.0.0.1:3441 --paths-file paths.txt --lint-from-html reference/page.html:lint-gap --lint-from-html reference/page.html:lint-gradient --lint-from-html reference/page.html:lint-rules`.
- Paths: every docs page plus one preview frame per theme per registry item (`/preview/light/<item>`, `/preview/dark/<item>`), so each component is checked in isolation in both themes.
- Theme: tokens are scoped on `:root` and `data-theme` is set on `<html>`; docs pages show both themes side by side through iframes.
- Results seen over the build: 0 findings across 300 combinations before merge. Real catches: a stale copy of exported tokens (bounce lint), aria-label vs visible text mismatches, a misspelled `aria-labelledby` in generated markup, a 320px overflow from an unbreakable code line, and a server-rendered preview crashing on a component that needed `"use client"`.
- QA workers found inert demos (the page script was never ported), dead anchors and a button that did nothing; screenshots of open dialog, drawer, menu and tooltip were the only proof for those.
- Fleet: six component workers plus one QA worker, each in its own worktree and port, builds serialized with `flock`.

# Fresh-app install test (registry items)

Proves a consumer can install and render the items from the built JSON.

1. Build the registry with absolute URLs pointing at a local origin (items that depend on each other use URLs).
2. Serve `public/` with `python3 -m http.server PORT --bind 127.0.0.1 --directory public &` (see leaked-lock note in orchestrator-rules.md).
3. `create-next-app` (pinned) in a scratch dir; `npx shadcn@<pin> init <origin>/r/<style>.json --yes --defaults`.
4. For each item: `npx shadcn@<pin> add <origin>/r/<item>.json --yes --overwrite`. Pass a real array of names, not one string.
5. Replace `app/page.tsx` with a page rendering the items; `next build --webpack`; start; run axe (both themes, 320 and 1440) and the overflow check on it.
6. Confirm files landed (`ls src/components/ui`), imports were rewritten, and a screenshot looks right.
7. Kill the file server by pid; rebuild the registry with production URLs.

Script it once per project (create app, init, add, build, axe) so the test is one command.

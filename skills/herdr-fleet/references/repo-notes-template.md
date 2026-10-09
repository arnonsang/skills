# Fleet notes for <repo name>

Keep this file at `<repo>/.fleet/NOTES.md`. The orchestrator reads it before slicing, and copies the relevant lines into each worker brief. Write only what a worker would get wrong without it.

## Isolation

- Which commands compile or touch the whole tree (so a half-written file in a shared checkout breaks everyone): e.g. `npm test` compiles `src/lib` first.
- Does the test suite write to a shared database? How to clone it for a worker (clone, never migrate an empty one if fixtures come from seed data):
  `createdb <name>_fleet_<slice> && pg_dump -d "$DATABASE_URL" --no-owner --no-acl | psql -d <new url>`
- Env loading: which env file the tests read, and whether a `DATABASE_URL` exported in the pane wins.
- Nested packages with their own `node_modules` or lockfile.
- Services that must be running (database container, cache), and who starts them.

## Commands

- Typecheck:
- Lint, read-only (and the write-mode command workers must never run):
- Single test file:
- Full suite (and how long it takes; known pre-existing failures):

## Code traps

- Imports that break a build target (e.g. a client module imported from shared code).
- Framework version quirks and where the local docs live.
- Style rules that CI enforces.
- Security rules for new routes (auth guards every route must declare).

## Integration and release

- How commits are made (signed? trailers forbidden?), branch naming, what must never be pushed.
- Build or deploy commands that read the working tree instead of git HEAD.

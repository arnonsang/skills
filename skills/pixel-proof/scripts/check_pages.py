"""Run the automated UI gate on built pages: custom lints, axe, horizontal overflow.

Every page is loaded in each theme at each width. Findings print one per line as
`<path> <theme> <width> <kind> <detail>`; the exit code is 1 when any finding exists.
Lint sources are parameters, so a project keeps one source of truth for its lints.

Example:
  python3 check_pages.py --base http://127.0.0.1:3000 --paths-file paths.txt \
      --lint-from-html ref/design.html:exp-gap-lint --lint-from-html ref/design.html:exp-lint
"""
import argparse
import html
import re
import sys
from pathlib import Path

from playwright.sync_api import Browser, Page, sync_playwright
from playwright.sync_api import Error as PlaywrightError

AXE_URL = "https://cdn.jsdelivr.net/npm/axe-core@4.14.0/axe.min.js"
AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
HEIGHT = 900

# Normalizes whatever a lint returns (DOM nodes, {element, issue}, {rule, detail, level}) to strings.
WRAP_JS = """(function (hits) { return (hits || []).filter(function (e) {
  return !(e && e.level) || e.level === "fail";
}).map(function (e) {
  if (e && e.nodeType) {
    var c = (typeof e.className === "string" && e.className.trim())
      ? "." + e.className.trim().split(/\\s+/).join(".") : "";
    return e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + c;
  }
  if (e && e.rule) return (e.rule + " " + (e.element || "") + " " + (e.detail || "")).trim();
  if (e && e.element) return (e.element + " " + (e.issue || e.borders || "")).trim();
  return JSON.stringify(e);
}); })(
SRC
)"""
AXE_RUN_JS = """() => axe.run(document, { runOnly: { type: "tag", values: TAGS } })
  .then((r) => r.violations.map((v) => ({
    id: v.id, impact: v.impact || "unknown",
    target: v.nodes.length ? JSON.stringify(v.nodes[0].target) : "?",
  })))"""


def lint_from_html(spec: str) -> tuple[str, str]:
    # FILE:ID reads the text of <pre id="ID"> and un-escapes it, so lints live in the reference page only.
    file_part, _, pre_id = spec.rpartition(":")
    text = Path(file_part).read_text(encoding="utf-8")
    match = re.search(rf'<pre id="{re.escape(pre_id)}"[^>]*>([\s\S]*?)</pre>', text)
    if not match:
        sys.exit(f"no <pre id={pre_id!r}> in {file_part}")
    body = re.sub(r"^\s*<code>|</code>\s*$", "", match.group(1))
    return pre_id, html.unescape(body)


def load_lints(args: argparse.Namespace) -> list[tuple[str, str]]:
    lints = [lint_from_html(spec) for spec in args.lint_from_html]
    for file in args.lint_file:
        lints.append((Path(file).stem, Path(file).read_text(encoding="utf-8")))
    return lints


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("paths", nargs="*", help="Page paths, e.g. /docs/button")
    parser.add_argument("--base", default="http://127.0.0.1:3000")
    parser.add_argument("--paths-file", help="File with one path per line")
    parser.add_argument("--lint-from-html", action="append", default=[], metavar="FILE:ID", help="Lint source in <pre id=ID> of FILE")
    parser.add_argument("--lint-file", action="append", default=[], metavar="JS", help="Lint source in a .js file (an IIFE returning an array)")
    parser.add_argument("--axe-url", default=AXE_URL, help="Pinned axe-core URL")
    parser.add_argument("--axe-tags", default=",".join(AXE_TAGS))
    parser.add_argument("--themes", default="light,dark")
    parser.add_argument("--widths", default="320,1440")
    parser.add_argument("--theme-mode", choices=["attr", "class"], default="attr", help="attr sets data-theme on <html>; class toggles .dark")
    parser.add_argument("--timeout-ms", type=int, default=15000)
    parser.add_argument("--no-axe", action="store_true")
    return parser.parse_args(argv)


def read_paths(args: argparse.Namespace) -> list[str]:
    paths = list(args.paths)
    if args.paths_file:
        lines = Path(args.paths_file).read_text(encoding="utf-8").splitlines()
        paths.extend(line.strip() for line in lines if line.strip())
    return paths


def run_lint(page: Page, source: str) -> list[str]:
    expr = source.strip().removesuffix(";")
    hits = page.evaluate(WRAP_JS.replace("SRC", expr)) or []
    return [str(h) for h in hits]


def check_axe(page: Page, url: str, tags: list[str]) -> list[str]:
    page.add_script_tag(url=url)
    script = AXE_RUN_JS.replace("TAGS", str(tags).replace("'", '"'))
    return [f"{v['id']} {v['impact']} {v['target']}" for v in page.evaluate(script)]


def check_overflow(page: Page) -> list[str]:
    sizes = page.evaluate("({ sw: document.documentElement.scrollWidth, w: window.innerWidth })")
    return [f"scrollWidth={sizes['sw']} innerWidth={sizes['w']}"] if sizes["sw"] > sizes["w"] else []


def set_theme(page: Page, theme: str, mode: str) -> None:
    if mode == "class":
        page.evaluate("(t) => document.documentElement.classList.toggle('dark', t === 'dark')", theme)
    else:
        page.evaluate("(t) => { document.documentElement.dataset.theme = t; }", theme)
    page.evaluate("document.fonts.ready.then(() => true)")


def check_combo(browser: Browser, url: str, theme: str, width: int, lints: list[tuple[str, str]], args: argparse.Namespace) -> list[str]:
    context = browser.new_context(viewport={"width": width, "height": HEIGHT})
    try:
        page = context.new_page()
        # "load" not "networkidle": framework link prefetches keep the network busy forever.
        try:
            response = page.goto(url, wait_until="load", timeout=args.timeout_ms)
        except PlaywrightError as error:
            return [f"load {str(error).splitlines()[0]}"]
        if response is None or not response.ok:
            return [f"http status {response.status if response else 'none'}"]
        set_theme(page, theme, args.theme_mode)
        findings = []
        for name, source in lints:
            findings += [f"{name} {d}" for d in run_lint(page, source)]
        if not args.no_axe:
            findings += [f"axe {d}" for d in check_axe(page, args.axe_url, args.axe_tags.split(","))]
        findings += [f"overflow {d}" for d in check_overflow(page)]
        return findings
    finally:
        context.close()


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    paths = read_paths(args)
    if not paths:
        sys.exit("no paths given")
    lints = load_lints(args)
    themes = args.themes.split(",")
    widths = [int(w) for w in args.widths.split(",")]
    total = combos = 0
    with sync_playwright() as runner:
        browser = runner.chromium.launch(headless=True)
        try:
            for path in paths:
                for theme in themes:
                    for width in widths:
                        combos += 1
                        for detail in check_combo(browser, args.base.rstrip("/") + path, theme, width, lints, args):
                            total += 1
                            print(f"{path} {theme} {width} {detail}", flush=True)
        finally:
            browser.close()
    print(f"{total} findings across {combos} page-theme-width combos")
    return 0 if total == 0 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

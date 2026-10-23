#!/usr/bin/env node
// second-look probe: load a local HTML file in headless Chromium at several widths and themes and report
// second-look-lint findings, JS errors, horizontal overflow and (with --hover) buttons that fail contrast on hover.
// Usage: node probe.mjs page.html [--widths 320,768,1440] [--themes light,dark] [--hover] [--json]
// Chromium: set CHROME_BIN, or have Playwright's chromium/chrome-headless-shell in ~/.cache/ms-playwright, or chromium/google-chrome on PATH.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync, readdirSync } from 'node:fs';
import { dirname, basename, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : dflt; };
const file = args.find(a => a.endsWith('.html') || a.endsWith('.htm'));
if (!file) { console.error('usage: node probe.mjs page.html [--widths 320,768,1440] [--themes light,dark] [--hover] [--json]'); process.exit(2); }
const widths = opt('--widths', '320,768,1440').split(',').map(Number);
const themes = opt('--themes', 'light,dark').split(',');
const hover = args.includes('--hover');
const asJson = args.includes('--json');

function findChrome() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  const cache = join(homedir(), '.cache', 'ms-playwright');
  if (existsSync(cache)) {
    const dirs = readdirSync(cache).filter(d => /^chromium/.test(d)).sort().reverse();
    for (const d of dirs) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
      const p = join(cache, d, rel); if (existsSync(p)) return p;
    }
  }
  for (const bin of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
    try { return execFileSync('which', [bin]).toString().trim(); } catch { /* not on PATH */ }
  }
  throw new Error('No Chromium found: set CHROME_BIN or run `npx playwright install chromium`.');
}

const chrome = findChrome();
const lint = readFileSync(join(HERE, 'second-look-lint.js'), 'utf8').replace('console.table(out);', 'window.__secondlook = out;');
const collect = `<script>window.__errs=[];addEventListener('error',function(e){__errs.push(String(e.message))});
addEventListener('load',function(){setTimeout(function(){var res={};try{${lint.trim().replace(/;\s*$/, '')};res.lint=window.__secondlook}catch(e){res.lint=[{level:'fail',rule:'probe',element:'',detail:String(e)}]}
${hover ? `res.hover=(function(){function p(c){return (c.match(/[\\d.]+/g)||[0,0,0]).map(Number)}function L(c){var m=p(c).slice(0,3).map(function(v){v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*m[0]+.7152*m[1]+.0722*m[2]}
function bg(el){while(el){var b=getComputedStyle(el).backgroundColor,a=p(b);if(a.length<4||a[3]>0.5)return b;el=el.parentElement}return 'rgb(255,255,255)'}var out=[];
document.querySelectorAll('button,a[class*=btn],[role=button],[role=tab],input[type=submit]').forEach(function(el){var cs=getComputedStyle(el);if(cs.backgroundImage!=='none'||el.matches('[aria-disabled=true],:disabled')||!el.getClientRects().length)return;
var a=L(cs.color),c=L(bg(el)),r=(Math.max(a,c)+.05)/(Math.min(a,c)+.05);if(r<4.5)out.push((String(el.className).replace(/\s*second-look-hover/g,'').trim()||el.tagName.toLowerCase())+' "'+el.textContent.trim().slice(0,24)+'" '+r.toFixed(2)+':1')});return out})();` : ''}
res.errors=window.__errs;res.scrollWidth=document.documentElement.scrollWidth;res.width=innerWidth;document.body.setAttribute('data-second-look',JSON.stringify(res))},2500)})</script>`;

const src = readFileSync(resolve(file), 'utf8');
const results = [];
for (const theme of themes) {
  let html = src.replace(/<html([^>]*)>/i, (m, a) => /data-theme=/.test(a) ? m.replace(/data-theme="[^"]*"/, `data-theme="${theme}"`) : `<html${a} data-theme="${theme}">`);
  html = html.replace(/<head([^>]*)>/i, `<head$1><style>:root{color-scheme:${theme}}</style>`);
  if (hover) html = html.replace(/:hover\b/g, '.second-look-hover').replace(/<\/body>/i, '<script>document.querySelectorAll("*").forEach(function(e){e.classList.add("second-look-hover")})</script></body>');
  html = html.replace(/<head([^>]*)>/i, `<head$1>${collect}`);
  // write next to the original so relative URLs still resolve
  const tmp = join(dirname(resolve(file)), `.second-look-probe-${process.pid}-${basename(file)}`);
  writeFileSync(tmp, html);
  try {
    for (const w of widths) {
      let out = '';
      try {
        out = execFileSync(chrome, ['--headless', '--no-sandbox', '--disable-gpu', `--window-size=${w},900`, '--virtual-time-budget=6000', '--dump-dom', pathToFileURL(tmp).href],
          { stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000, maxBuffer: 1 << 28 }).toString();
      } catch (e) { out = e.stdout ? e.stdout.toString() : ''; }
      const m = out.match(/data-second-look="([^"]*)"/);
      const data = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')) : { lint: [], errors: ['probe did not finish (page too slow or blocked)'] };
      results.push({ theme, width: w, ...data });
    }
  } finally { unlinkSync(tmp); }
}

if (asJson) { console.log(JSON.stringify(results, null, 2)); }
let failed = false;
for (const r of results) {
  const fails = (r.lint || []).filter(f => f.level !== 'info');
  const overflow = r.scrollWidth > r.width;
  const bad = fails.length || (r.errors || []).length || overflow || (r.hover || []).length;
  failed = failed || !!bad;
  if (asJson) continue;
  console.log(`${bad ? 'FAIL' : 'ok  '} ${r.theme} ${r.width}px  lint:${fails.length}  errors:${(r.errors || []).length}  overflow:${overflow ? r.scrollWidth + 'px' : 'no'}${hover ? '  hover-contrast:' + (r.hover || []).length : ''}`);
  for (const f of r.lint || []) console.log(`       ${f.level} ${f.rule} ${f.element}: ${f.detail}`);
  for (const e of r.errors || []) console.log(`       error ${e}`);
  for (const h of r.hover || []) console.log(`       hover ${h}`);
}
process.exit(failed ? 1 : 0);

#!/usr/bin/env python3
"""WCAG 2 contrast ratios. Translucent colors (#rrggbbaa) are composited over the background first.

    contrast.py "#ffffff" "#cb0169"                one pair
    contrast.py --pairs pairs.json                 [{"fg": "#..", "bg": "#..", "min": 4.5, "name": ".."}]
    contrast.py --gradient "#cb0169" "#6a32de" "#ffffff"   worst point along a 2-stop gradient

Exit code 1 when any pair is below its minimum (default 4.5 for text; use 3 for large text, borders, icons and focus rings).
"""
import json, sys

def rgb(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], (int(h[6:8], 16) / 255 if len(h) == 8 else 1.0)

def lum(c):
    lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]

def ratio(fg, bg):
    (b, _), (f, a) = rgb(bg), rgb(fg)
    f = [f[i] * a + b[i] * (1 - a) for i in range(3)]
    hi, lo = sorted([lum(f), lum(b)], reverse=True)
    return (hi + 0.05) / (lo + 0.05)

def mix(a, b, t):
    (x, _), (y, _) = rgb(a), rgb(b)
    return '#' + ''.join(f'{round((x[i] * (1 - t) + y[i] * t) * 255):02x}' for i in range(3))

def main(argv):
    rows = []
    if argv[:1] == ['--pairs']:
        rows = [(p.get('name', f"{p['fg']} on {p['bg']}"), p['fg'], p['bg'], float(p.get('min', 4.5))) for p in json.load(open(argv[1]))]
    elif argv[:1] == ['--gradient']:
        a, b, text = argv[1:4]
        worst = min((ratio(text, mix(a, b, k / 20)), k) for k in range(21))
        print(f'{text} on gradient {a} -> {b}: worst {worst[0]:.2f}:1 at {worst[1] * 5}%')
        return 0 if worst[0] >= 4.5 else 1
    elif len(argv) >= 2:
        rows = [(f'{argv[0]} on {argv[1]}', argv[0], argv[1], float(argv[2]) if len(argv) > 2 else 4.5)]
    else:
        print(__doc__); return 2
    bad = 0
    for name, fg, bg, need in rows:
        r = ratio(fg, bg); ok = r >= need; bad += not ok
        print(f'{"pass" if ok else "FAIL"}  {r:5.2f}:1  (needs {need:g})  {name}')
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

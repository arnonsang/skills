/* second-look lint. Paste into DevTools on any page (or run scripts/probe.mjs). Checks the Don'ts a browser can measure:
   gap, gradient-border, gradient-text, side-stripe, eyebrow-repeat, heading-icon-repeat, uppercase-repeat,
   bounce, layout-transition, decorative-gradient, infinite-loop (info), copy, placeholder.
   Areas marked data-second-look-demo are deliberate demos and are skipped; data-gap-ok marks an intentional zero gap.
   Returns the findings array and prints it with console.table. */
(function () {
  var out = [];
  var name = function (e) { return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).filter(function (c) { return c !== 'second-look-hover'; }).slice(0, 3).join('.') : ''); };
  var add = function (rule, el, detail, level) { out.push({ level: level || 'fail', rule: rule, element: el ? name(el) : '', detail: detail }); };
  var shown = function (e) { var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  var DEMO = '[data-second-look-demo],[data-qid-demo]';
  var demo = function (e) { return !!e.closest(DEMO); };
  var all = Array.prototype.slice.call(document.querySelectorAll('body *')).filter(function (e) { return !e.closest('svg,pre,code,script,style,template,[hidden]'); });
  var eyebrows = [], iconHeads = [], upper = [], gradients = [], loops = 0;
  all.forEach(function (el) {
    var cs = getComputedStyle(el), bg = cs.backgroundImage;
    // gap
    if (/flex|grid/.test(cs.display) && !el.closest('[data-gap-ok]') && (parseFloat(cs.rowGap) || 0) + (parseFloat(cs.columnGap) || 0) === 0) {
      var kids = Array.prototype.filter.call(el.children, function (c) { var s = getComputedStyle(c); return s.display !== 'none' && s.position !== 'absolute' && s.position !== 'fixed' && shown(c); });
      for (var i = 1; i < kids.length; i++) {
        var a = kids[i - 1].getBoundingClientRect(), b = kids[i].getBoundingClientRect(), sa = getComputedStyle(kids[i - 1]), sb = getComputedStyle(kids[i]);
        var tx = Math.abs(b.left - a.right) < 1 && b.top < a.bottom && a.top < b.bottom && !(parseFloat(sa.borderRightWidth) || parseFloat(sb.borderLeftWidth));
        var ty = Math.abs(b.top - a.bottom) < 1 && b.left < a.right && a.left < b.right && !(parseFloat(sa.borderBottomWidth) || parseFloat(sb.borderTopWidth));
        if (tx || ty) { add('gap', el, 'children touch with no gap'); break; }
      }
      // spacing done with sibling margins instead of gap
      var mk = kids.slice(0, -1).filter(function (c) { var s = getComputedStyle(c); return (parseFloat(s.marginRight) || 0) + (parseFloat(s.marginBottom) || 0) > 0; });
      if (kids.length > 1 && mk.length >= kids.length - 1) add('gap', el, 'siblings spaced with margins; use gap');
    }
    if (bg.indexOf('gradient') > -1) {
      // gradient-text
      if (!el.closest('[data-brand-gradient],[data-brand-mark]') && ((cs.backgroundClip || cs.webkitBackgroundClip || '').indexOf('text') > -1 || cs.webkitBackgroundClip === 'text')) add('gradient-text', el, 'gradient painted into text');
      // gradient-border
      var sides = ['Top', 'Right', 'Bottom', 'Left'].filter(function (s) { var w = parseFloat(cs['border' + s + 'Width']), c = cs['border' + s + 'Color']; var al = c.indexOf('rgba') === 0 ? parseFloat(c.split(',')[3]) : (c === 'transparent' ? 0 : 1); return w > 0 && al < 1; });
      var origins = cs.backgroundOrigin.split(','), clips = cs.backgroundClip.split(',');
      var fills = clips.some(function (c, k) { return c.trim() === 'border-box' && (origins[k] || origins[0]).trim() === 'border-box'; });
      if (sides.length && !fills) add('gradient-border', el, clips[0].trim() !== 'border-box' ? '1px ring of the page color' : 'edge stripe from the wrapped gradient');
      // decorative-gradient: repeating patterns, data marks, skeletons, logo marks and the brand button are allowed
      if (!demo(el) && !/repeating-/.test(bg) && shown(el) && !el.closest('.qid-skel,[data-brand-mark],[role=img],[role=progressbar]') && !el.matches('[data-brand-gradient],.qid-btn--brand,.qid-gradient')) gradients.push(el);
    }
    // side-stripe
    var bl = parseFloat(cs.borderLeftWidth), br = parseFloat(cs.borderRightWidth), bt = parseFloat(cs.borderTopWidth);
    if ((bl > 1 && bl > bt && cs.borderLeftColor !== 'rgba(0, 0, 0, 0)') || (br > 1 && br > bt && cs.borderRightColor !== 'rgba(0, 0, 0, 0)')) { if (!demo(el) && shown(el)) add('side-stripe', el, 'thick colored side border'); }
    // timing: bounce and layout transitions
    var tf = cs.transitionTimingFunction + ',' + cs.animationTimingFunction;
    var over = (tf.match(/cubic-bezier\(([^)]+)\)/g) || []).some(function (m) { var v = m.slice(13, -1).split(',').map(parseFloat); return v[1] > 1 || v[3] > 1 || v[1] < 0 || v[3] < 0; })
      || (tf.match(/linear\(([^)]+)\)/g) || []).some(function (m) { return m.slice(7, -1).split(',').some(function (p) { return parseFloat(p) > 1.0001; }); });
    if (over && (cs.transitionDuration !== '0s' || cs.animationName !== 'none')) add('bounce', el, 'easing overshoots past its end value');
    if (/(^|,\s*)(width|height|top|left|right|bottom|margin[a-z-]*|padding[a-z-]*)(\s|,|$)/.test(cs.transitionProperty) && cs.transitionDuration !== '0s') add('layout-transition', el, 'transition: ' + cs.transitionProperty);
    if (cs.animationIterationCount.indexOf('infinite') > -1 && cs.animationName !== 'none' && !demo(el) && !el.closest('[aria-busy=true],.is-working') && shown(el)) loops++;
    // uppercase labels
    if (cs.textTransform === 'uppercase' && shown(el) && el.textContent.trim().length > 1 && !demo(el)) upper.push(el);
    // eyebrow and heading icon above h2/h3
    if (/^H[23]$/.test(el.tagName) && shown(el)) {
      var prev = el.previousElementSibling;
      if (prev && prev.textContent.trim().length < 40 && (getComputedStyle(prev).textTransform === 'uppercase' || /^\s*\d{1,2}\s*[·.\-/]/.test(prev.textContent) || /eyebrow|kicker/.test(prev.className))) eyebrows.push(el);
      var sib = prev || el.parentElement.firstElementChild;
      if (sib && sib !== el && sib.querySelector && sib.querySelector('svg') && sib.textContent.trim() === '' && getComputedStyle(sib).backgroundColor !== 'rgba(0, 0, 0, 0)') iconHeads.push(el);
    }
  });
  if (eyebrows.length >= 3) add('eyebrow-repeat', eyebrows[0], eyebrows.length + ' headings carry an eyebrow or number');
  if (iconHeads.length >= 3) add('heading-icon-repeat', iconHeads[0], iconHeads.length + ' headings carry an icon tile');
  if (upper.length > 6) add('uppercase-repeat', upper[0], upper.length + ' uppercase labels');
  if (gradients.length > 3) add('decorative-gradient', gradients[0], gradients.length + ' gradient backgrounds outside demos: ' + gradients.slice(0, 5).map(name).join(', '));
  if (loops) add('infinite-loop', null, loops + ' endless animations outside demos and busy regions', 'info');
  // copy
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { var p = n.parentElement; return p && !p.closest('pre,code,script,style,[hidden],[data-second-look-dont],[data-qid-dont],' + DEMO) ? 1 : 2; } });
  var text = '', n; while ((n = walker.nextNode())) text += ' ' + n.nodeValue;
  var buzz = text.match(/\b(seamless(ly)?|supercharge[ds]?|unleash(es|ed)?|next-gen(eration)?|cutting-edge|game-?changer|world-class|revolutioni[sz]e|synerg(y|ies)|empower(s|ing)?)\b/gi);
  if (buzz) add('copy', null, 'buzzwords: ' + Array.from(new Set(buzz.map(function (w) { return w.toLowerCase(); }))).join(', '));
  if (/\u2014/.test(text)) add('copy', null, (text.match(/\u2014/g) || []).length + ' em dashes in visible text');
  var ph = text.match(/\b(John Doe|Jane Doe|Acme( Corp)?|Lorem ipsum)\b/gi);
  if (ph) add('placeholder', null, 'placeholder content: ' + Array.from(new Set(ph)).join(', '));
  console.table(out);
  return out;
})();

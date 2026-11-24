/* momentos.js — empaquetado (script clásico) de los momentos photo-chapters, word-highlight y
   picture-develops del skill design-taste-frontend (github.com/Leonxlnx/taste-skill, licencia MIT). */
(function(){
'use strict';
var lib = (function(){
/*
  moments/lib.js - the few helpers every moment shares (taste-skill). One ES module, no dependencies.

  reduced()            true under prefers-reduced-motion: a moment then shows its finished state only
  phone()              true on a phone: under 640px wide, or a touch screen in landscape under 500px tall
                       (a phone turned sideways). A moment shows its finished state there too, unless
                       its module says `export const phone = true` (word-highlight, picture-develops,
                       photo-chapters: light enough to run there).
  still()              reduced() || phone(): the one question every moment asks. The loader (moments.js)
                       hands each moment a lib whose reduced() answers still() (only reduced() for a
                       moment that runs on a phone), so a moment written against reduced() is static
                       where it must be, and sets data-moment-still on its host ("reduced" or "phone").
                       The answer is taken once, when the page loads.
  coarse()             true on a touch screen (no hover moments there)
  inCard(el)           true when el is, or sits in, a card, a plan, a result or a bento cell: nothing
                       on a card ever moves on scroll, so the loader leaves such a moment still
  scrub(el, fn, opts)  calls fn(progress, rect) from a requestAnimationFrame while el is near the
                       screen. mode 'hold' (default): 0 when el's top reaches the viewport top, 1 when
                       its bottom reaches the viewport bottom (a pinned stage's run). mode 'view': 0 when
                       el's top enters at the bottom edge, 1 when its bottom leaves at the top.
                       Returns { destroy, update }. Nothing is captured: the page scrolls natively.
  once(el, fn, opts)   fn once: when `threshold` of el is on screen, or el covers that share of the screen (a
                       target taller than the screen can never show it), or part of it has stayed on screen
                       for opts.rescue ms (3000), or the observer has not reported at all after 1.5 s of a
                       visible page. Nothing waits for ever. Returns { destroy }.
  split(el, unit)      wraps the words ('words') or letters ('chars') of el in spans
                       (.mo-w, .mo-c, each with an inner .mo-i that moves) and keeps the text readable:
                       the host gets aria-label, the spans aria-hidden. Returns the inner spans.
  lines(words)         groups word spans into lines by their offsetTop; returns an array of arrays.
  fontsReady(ms)       resolves when the fonts are loaded, or after ms.
  clamp, lerp, ease    the maths.
*/
const rq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const reduced = () => !!(rq && rq.matches);
const pq = typeof matchMedia === 'function' ? [matchMedia('(max-width: 639px)'), matchMedia('(pointer: coarse) and (max-height: 499px) and (max-width: 959px)')] : [];
const phone = () => pq.some(q => q.matches);
const still = () => reduced() || phone();
const stillWhy = () => (reduced() ? 'reduced' : phone() ? 'phone' : '');
const inCard = el => !!(el && el.closest && el.closest('.card, .plan, .result, .knock, [data-card], .bento > *'));
const coarse = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = {
  out: t => 1 - Math.pow(1 - t, 3),
  quint: t => 1 - Math.pow(1 - t, 5),
  expo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  smooth: (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); },
};

function scrub(el, fn, { mode = 'hold', margin = '25% 0px' } = {}) {
  // on from the start, with the scroll listener: an observer that never reports (a dead stub, a page it cannot reach) leaves the
  // moment following the scroll instead of frozen at its first state; the observer turns it off when the target is far away
  let on = true, raf = 0, last = -1;
  const tick = () => {
    raf = 0;
    if (!on) return;
    const r = el.getBoundingClientRect(), vh = innerHeight;
    let p = mode === 'view' ? (vh - r.top) / (vh + r.height) : -r.top / Math.max(1, r.height - vh);
    p = clamp(p);
    if (p !== last) { last = p; fn(p, r); }
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const io = new IntersectionObserver(es => {
    on = es[es.length - 1].isIntersecting;
    removeEventListener('scroll', req); removeEventListener('resize', req);
    if (on) { addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); req(); }
  }, { rootMargin: margin });
  io.observe(el);
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); req();
  return {
    update: () => { last = -1; req(); },
    destroy() { io.disconnect(); removeEventListener('scroll', req); removeEventListener('resize', req); if (raf) cancelAnimationFrame(raf); },
  };
}

function once(el, fn, { threshold = 0.35, margin = '0px', rescue = 3000 } = {}) {
  // fn runs once when `threshold` of el is on screen, or el covers that share of the screen (a target taller
  // than the screen can never show `threshold` of itself), or any part of it has stayed on screen for `rescue`
  // ms. An observer that has not reported at all after 1.5 s of a visible page runs fn too: nothing waits for ever
  let timer = 0, starve = 0, done = false;
  const go = () => { if (done) return; done = true; clearTimeout(timer); clearTimeout(starve); io.disconnect(); fn(); };
  const steps = [0];
  for (let t = 0.1; t < threshold - 1e-6; t += 0.1) steps.push(+t.toFixed(2));
  steps.push(threshold);
  const io = new IntersectionObserver(es => {
    clearTimeout(starve);
    const e = es[es.length - 1];
    if (!e.isIntersecting) { clearTimeout(timer); timer = 0; return; }
    const vh = e.rootBounds ? e.rootBounds.height : innerHeight;
    if (e.intersectionRatio >= threshold || e.intersectionRect.height >= vh * threshold) return go();
    if (!timer) timer = setTimeout(go, rescue);
  }, { threshold: steps, rootMargin: margin });
  const wait = () => { starve = setTimeout(() => (document.hidden ? wait() : go()), 1500); };
  wait();
  io.observe(el);
  return { destroy() { done = true; clearTimeout(timer); clearTimeout(starve); io.disconnect(); } };
}

function split(el, unit = 'words') {
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  const inners = [];
  const wrap = (text, cls) => {
    const s = document.createElement('span');
    s.className = cls;
    const i = document.createElement('span');
    i.className = 'mo-i';
    i.textContent = text;
    s.append(i);
    inners.push(i);
    return s;
  };
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          if (unit === 'chars') {
            const w = document.createElement('span');
            w.className = 'mo-w';
            for (const ch of part) w.append(wrap(ch, 'mo-c'));
            frag.append(w);
          } else frag.append(wrap(part, 'mo-w'));
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('mo-w')) {
        // a link or button inside keeps its name: its words are hidden with the rest, so it is named first
        if (n.matches('a[href], button') && !n.getAttribute('aria-label') && n.textContent.trim()) n.setAttribute('aria-label', n.textContent.replace(/\s+/g, ' ').trim());
        walk(n);
      }
    });
  };
  walk(el);
  el.querySelectorAll('.mo-w').forEach(w => w.setAttribute('aria-hidden', 'true'));
  return inners;
}

function lines(words) {
  const out = [];
  let top = null;
  for (const w of words) {
    const t = w.offsetTop;
    if (top === null || Math.abs(t - top) > 2) { out.push([]); top = t; }
    out[out.length - 1].push(w);
  }
  return out;
}

const fontsReady = (ms = 900) => Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, ms))]);

/*
  blocks(root, skip)   the section's words and pictures as whole blocks, for a moment that uncovers a section with a
                       clip (a disc, a line): a block is a heading, paragraph, list item, button, link, picture, UI
                       window or any element that carries text of its own, outermost first (a frame with its own
                       text is one block). A clip that slices through a block cuts its words mid-move, so such a
                       moment keeps each block invisible until the clip has passed the whole of it, then fades it
                       in whole. Returns { list, measure, set, release }:
    list      [{ el, l, t, r, b }] with the box of each block in root's own coordinates (set by measure)
    measure() reads the boxes again (call when the root's size changes or the fonts arrive)
    set(fn)   fn(block) -> opacity 0-1 for every block; 1 puts the element's own inline opacity back
    release() every block as it was
  skip: elements (the moment's own layers) that are never a block.
*/
const BLOCK = 'h1,h2,h3,h4,h5,h6,p,li,dt,dd,blockquote,figcaption,label,a,button,img,picture,video,canvas,svg,table,figure,.frame,.dw,[data-moment-block]';
function blocks(root, skip = []) {
  const list = [];
  const walk = el => {
    for (const c of el.children) {
      if (skip.includes(c) || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(c.tagName)) continue;
      const own = [...c.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (c.matches(BLOCK) || own) list.push({ el: c, was: c.style.opacity, l: 0, t: 0, r: 0, b: 0 });
      else walk(c);
    }
  };
  walk(root);
  const measure = () => {
    const rr = root.getBoundingClientRect();
    for (const b of list) {
      const r = b.el.getBoundingClientRect();
      b.l = r.left - rr.left; b.t = r.top - rr.top; b.r = r.right - rr.left; b.b = r.bottom - rr.top;
    }
  };
  measure();
  const set = fn => { for (const b of list) { const o = fn(b); b.el.style.opacity = o >= 0.999 ? b.was : (o <= 0 ? '0' : o.toFixed(3)); } };
  const release = () => { for (const b of list) b.el.style.opacity = b.was; };
  return { list, measure, set, release };
}

return { reduced: reduced, phone: phone, still: still, stillWhy: stillWhy, inCard: inCard, coarse: coarse, clamp: clamp, lerp: lerp, ease: ease, scrub: scrub, once: once, split: split, lines: lines, fontsReady: fontsReady, blocks: blocks };
})();
var photoChapters = (function(){
/*
  photo-chapters - a short story told in three to five photographs, one large frame at a time. The
  section holds on screen while the page scrolls: its h2 and lead at the top, below them one big
  photograph the width of the page's edges, and on it, at its lower left, a panel in the page's ground
  with the chapter in hand (its number, a title and two lines). As the reader scrolls, each next
  photograph is uncovered over the one before from its foot upward, settling from a slight zoom, and
  the panel changes to its chapter half way through the wipe. The wipe follows the scrollbar (it runs
  back on the way up) and takes under half of a chapter's share of the scroll; the photograph then
  holds for the rest, so there is time to read. Photo-led and calm: for a place, a product or a
  service (the room, the kitchen, the workshop, a day of a tour). No WebGL, no canvas.

    <section class="section" data-moment="photo-chapters">
      <div class="container mo-ph">
        <div class="mo-ph__head"><h2>A night at the harbour house</h2><p>One line.</p></div>
        <ol class="mo-ph__list">
          <li class="mo-ph__ch">
            <figure class="mo-ph__pic"><img src="…" alt="…" width="1800" height="1200"></figure>
            <h3>Arrive by the coast road</h3>
            <p>Two lines.</p>
          </li>
          …three to five chapters, one photograph each
        </ol>
      </div>
    </section>

  Its height is its own: live the section is (hold + 1) screens, the hold growing with the chapters
  (three chapters hold two screens, four or five hold three: about two thirds of a screen each), and
  at rest it is as tall as its chapters, one screen at least. Write no --h and no data-screen on it:
  the checker and the layout check read a live photo-chapters section (.is-live) as whole screens, four
  at most, and still hold it to that.
  At rest (reduced motion, no script, a failed module, a screen under 600px tall such as a phone
  turned sideways) the chapters stand side by side, each photograph over its title and lines (a phone
  stacks them): the same words and pictures, nothing hidden. Live at every width from 600px of
  height, so a phone held upright gets it too (one picture at a time, a clip and a transform).
  Every chapter's words stay in the page for a screen reader; only the one in hand is shown.
  opts: zoom (the settle, 1.06; 1-1.1).
*/
const phone = true;

function mount(root, opts, lib) {
  const box = root.querySelector('.mo-ph') || root;
  const list = root.querySelector('.mo-ph__list');
  const chapters = [...root.querySelectorAll('.mo-ph__ch')];
  const pics = chapters.map(c => c.querySelector('.mo-ph__pic'));
  if (!list || chapters.length < 2 || pics.some(p => !p)) return {};
  const homes = pics.map(p => p.parentElement);
  const listHome = { parent: list.parentElement, next: list.nextSibling };
  const zoom = lib.clamp(+opts.zoom || 1.06, 1, 1.1);
  const n = chapters.length;
  // about two thirds of a screen of scroll a chapter, in whole screens so the section stays on the grid
  const hold = n <= 3 ? 2 : 3;
  // each chapter's words in a box of their own, so the live panel can stack them in one place
  chapters.forEach(c => {
    if (c.querySelector(':scope > .mo-ph__words')) return;
    const w = document.createElement('div');
    w.className = 'mo-ph__words';
    [...c.children].filter(el => !el.classList.contains('mo-ph__pic')).forEach(el => w.append(el));
    c.append(w);
  });
  const stage = document.createElement('div');
  stage.className = 'mo-ph__stage';
  const panel = document.createElement('div');
  panel.className = 'mo-ph__panel';
  const count = document.createElement('p');
  count.className = 'mo-ph__count';
  count.setAttribute('aria-hidden', 'true');
  panel.append(count);
  const pad = v => String(v).padStart(2, '0');
  let live = false, scrubber = null, on = -1;
  const fits = () => !lib.reduced() && innerHeight >= 600;
  const show = k => {
    if (k === on) return;
    on = k;
    chapters.forEach((c, i) => c.classList.toggle('is-on', i === k));
    count.textContent = `${pad(k + 1)} / ${pad(n)}`;
  };
  // p 0-1 over the held screens: chapter k owns [k/n, (k+1)/n). Its photograph is uncovered over the
  // 45% of a share that straddles that boundary, then holds; the words change half way through the wipe.
  // The last wipe ends at 0.2 of its share, so the last chapter holds to the section's end
  const draw = p => {
    const seg = 1 / n;
    let k = 0;
    pics.forEach((pic, i) => {
      const u = i === 0 ? 1 : lib.clamp((p - (i - 0.25) * seg) / (0.45 * seg));
      const e = lib.ease.out(u);
      pic.style.setProperty('--mo-c', `${((1 - e) * 100).toFixed(2)}%`);
      pic.style.setProperty('--mo-z', (zoom - (zoom - 1) * e).toFixed(4));
      if (u >= 0.5) k = i;
    });
    show(k);
  };
  const go = () => {
    if (live) return;
    live = true;
    root.style.setProperty('--mo-hold', String(hold));
    pics.forEach(p => stage.append(p));
    panel.append(list);
    stage.append(panel);
    box.append(stage);
    root.classList.add('is-live');
    box.setAttribute('data-edge-free', '');   // live the box is one held screen of the section: the layout check skips it
    draw(0);
    scrubber = lib.scrub(root, draw);
  };
  const rest = () => {
    if (!live) return;
    live = false;
    scrubber?.destroy(); scrubber = null;
    root.classList.remove('is-live');
    root.style.removeProperty('--mo-hold');
    box.removeAttribute('data-edge-free');
    listHome.parent.insertBefore(list, listHome.next);
    pics.forEach((p, i) => { homes[i].prepend(p); p.style.removeProperty('--mo-c'); p.style.removeProperty('--mo-z'); });
    chapters.forEach(c => c.classList.remove('is-on'));
    stage.remove();
    on = -1;
  };
  const sync = () => (fits() ? go() : rest());
  sync();
  let t = 0;
  const onResize = () => { clearTimeout(t); t = setTimeout(sync, 120); };
  addEventListener('resize', onResize);
  const rq = matchMedia('(prefers-reduced-motion: reduce)');
  rq.addEventListener('change', sync);
  return { destroy() { removeEventListener('resize', onResize); rq.removeEventListener('change', sync); rest(); } };
}

return { phone: phone, default: mount };
})();
var wordHighlight = (function(){
/*
  word-highlight - one statement's words turn from grey to ink, word by word, as the statement crosses
  the middle of the screen. Scrubbed to the scrollbar (it runs back when the visitor scrolls up); a
  <strong> word turns to the accent instead of the ink. For the one statement a page stands on, 12 to
  40 words, on its own ground or beside one picture.

    <section class="section" data-moment="word-highlight">
      <div class="container"><p class="mo-wh__text">Give tasks to <strong>Relay</strong> like a teammate …</p></div>
    </section>

  opts: from 0.85 (the statement's top at this share of the screen's height turns the first word),
        to 0.45 (its bottom at this share turns the last).
  Reduced motion, no script: the whole statement in ink. It runs on a phone too (one paragraph's
  colours, no layout, no pin).
*/
const phone = true;
function mount(root, opts, lib) {
  const text = root.matches('p, h2, h3, blockquote') ? root : (root.querySelector('.mo-wh__text') || [...root.querySelectorAll('p, h2, h3, blockquote')].find(p => !p.matches('.t-label, .t-small, .muted')));
  if (!text) return {};
  root.classList.add('mo-wh');
  const words = lib.split(text, 'words').map(i => i.parentElement);
  if (lib.reduced()) { words.forEach(w => w.classList.add('is-on')); root.classList.add('is-done'); return {}; }
  const from = opts.from ?? 0.85, to = opts.to ?? 0.45;
  let n = -1;
  const s = lib.scrub(text, (p, r) => {
    const vh = innerHeight, start = vh * from, end = vh * to;
    const t = lib.clamp((start - r.top) / Math.max(1, (start - end) + r.height));
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;   // page bottom: it can climb no further, the statement stands in full ink
    const k = atEnd ? words.length : Math.round(t * words.length);
    if (k === n) return;
    n = k;
    words.forEach((w, i) => w.classList.toggle('is-on', i < k));
  }, { mode: 'view' });
  return { destroy: s.destroy };
}

return { phone: phone, default: mount };
})();
var pictureDevelops = (function(){
/*
  picture-develops - a photograph develops once as its frame comes on screen, in one of two looks.

  look "film" (the default on a place, product or service page, <meta name="site-kind" content="other">
  or <html data-type="place">): the photograph comes up out of the paper the way a print does in the
  developer tray: pale, flat and without colour at first, its darks arriving before its light tones,
  then its colour, while it settles from a slight zoom. About 1.6 s, once; transform and a CSS filter
  on the one picture, no canvas, any origin.

  look "print" (the default on a tech, gaming or software page): first a two-tone
  halftone print, ink dots on paper in the ground's surface tone (so the frame keeps its edges and
  radius while it develops), its darkest cells first, then the print gives way to the photograph,
  which settles from a slight zoom. A picture with a clear subject against a plain field (a rock on
  a beach, a facade) prints best; an all-mid-tone picture is a blur of dots. About 1.8 s, once; timed, not scrubbed. One 2D
  canvas, freed when it is done. Under reduced motion, without script, or when the picture cannot be
  read (another origin without CORS) the photograph stands.

    <figure class="frame frame--photo" data-moment="picture-develops" data-moment-opts='{"cell": 9}'>
      <img src="…" alt="…" width="1800" height="1200" crossorigin="anonymous">
    </figure>

  The host sets the picture's size (an aspect-ratio or a height); the photograph fills it (cover).
  opts: look "film" | "print" (by the page's kind when left out); cell px of the halftone (9, 6-14);
        duration ms (film 1600, print 1800); focus [x, y] 0-1 of the crop (0.5, 0.5).
  Give it a photograph big enough to be the section's subject (half the container or more): a small
  picture developing reads as a loading state, not a moment.
  On a phone the film look runs too (one picture, a filter and a transform, once); the print look
  (a canvas) shows the photograph there.
*/
const phone = true;
// a place, product or service page (site-kind other): the photographic look, never the halftone print
const otherPage = () => {
  const m = document.querySelector('meta[name="site-kind"]');
  return document.documentElement.dataset.type === 'place' || (!!m && m.content.trim().toLowerCase() === 'other');
};
function mount(root, opts, lib) {
  const img = root.querySelector('img');
  if (!img) return {};
  root.classList.add('mo-pd');
  if (lib.reduced()) { root.classList.add('is-done'); return {}; }
  if ((opts.look || (otherPage() ? 'film' : 'print')) === 'film') return film(root, img, opts, lib);
  if (lib.phone()) { root.dataset.momentStill = 'phone'; root.classList.add('is-done'); return {}; }
  const cell = Math.max(6, Math.min(14, +opts.cell || 9));
  const dur = Math.max(900, +opts.duration || 1800);
  const [fx, fy] = Array.isArray(opts.focus) ? opts.focus : [0.5, 0.5];
  const canvas = document.createElement('canvas');
  canvas.className = 'mo-pd__print';
  canvas.setAttribute('aria-hidden', 'true');
  root.append(canvas);
  root.classList.add('is-live');
  let raf = 0, done = false;
  const finish = () => { if (done) return; done = true; if (raf) cancelAnimationFrame(raf); canvas.remove(); root.classList.remove('is-live'); root.classList.add('is-done'); };
  // the paper is the ground's surface tone, a shade off the page, so the frame keeps its edges while
  // the print develops; the dots are the ink
  const tokens = () => { const cs = getComputedStyle(root); return { bg: cs.getPropertyValue('--surface').trim() || cs.getPropertyValue('--bg').trim() || '#f4f4f4', ink: cs.getPropertyValue('--ink').trim() || '#111' }; };
  const sample = () => {
    const w = root.clientWidth, h = root.clientHeight;
    if (!w || !h || !img.naturalWidth) return null;
    canvas.width = w; canvas.height = h;
    const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
    const off = document.createElement('canvas');
    off.width = cols; off.height = rows;
    const ox = off.getContext('2d', { willReadFrequently: true });
    const ir = img.naturalWidth / img.naturalHeight, fr = w / h;
    let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
    if (ir > fr) { sw = sh * fr; sx = (img.naturalWidth - sw) * fx; } else { sh = sw / fr; sy = (img.naturalHeight - sh) * fy; }
    ox.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
    let data;
    try { data = ox.getImageData(0, 0, cols, rows).data; } catch { return null; }
    const dark = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) dark[i] = 1 - (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
    return { cols, rows, dark };
  };
  const draw = (g, t) => {
    const ctx = canvas.getContext('2d');
    const { bg, ink } = tokens();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = ink;
    const thr = 1 - t * 1.12;               // the darkest cells first, then the lighter ones
    const half = cell / 2;
    ctx.beginPath();
    for (let r = 0; r < g.rows; r++) {
      const shift = (r & 1) ? half * 0.5 : -half * 0.5;
      for (let c = 0; c < g.cols; c++) {
        const d = g.dark[r * g.cols + c];
        if (d <= thr) continue;
        const k = Math.min(1, (d - thr) / 0.22);  // a cell's dot grows in over a short span
        const rad = half * Math.min(1, d * 1.15) * k;
        if (rad < 0.35) continue;
        const x = c * cell + half + shift, y = r * cell + half;
        ctx.moveTo(x + rad, y);
        ctx.arc(x, y, rad, 0, 6.2832);
      }
    }
    ctx.fill();
  };
  const run = async () => {
    try { if (!img.complete) await new Promise((r, j) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', j, { once: true }); }); await img.decode?.(); } catch { /* shows anyway */ }
    const g = sample();
    if (!g) return finish();
    root.classList.add('is-developing');
    let t0 = 0;
    const step = now => {
      if (done) return;
      if (!t0) t0 = now;
      const u = Math.min(1, (now - t0) / dur);
      if (u < 0.58) { draw(g, 0.14 + lib.ease.out(u / 0.58) * 0.86); canvas.style.opacity = '1'; }
      else { canvas.style.opacity = String(1 - lib.ease.smooth(0.58, 1, u)); }
      if (u < 1) raf = requestAnimationFrame(step); else finish();
    };
    raf = requestAnimationFrame(step);
  };
  // the print covers the photograph only from just before the frame scrolls in: a frame no observer reports keeps its photograph
  canvas.style.display = 'none'; root.classList.remove('is-live');
  const cover = () => { if (done) return; canvas.style.display = ''; root.classList.add('is-live'); };
  const r0 = root.getBoundingClientRect();
  if (r0.bottom > 0 && r0.top < innerHeight * 1.25) cover();   // already near at mount: covered at once, as before
  const arm = lib.once(root, cover, { threshold: 0, margin: '0px 0px 25% 0px' });
  const seen = lib.once(root, () => { cover(); run(); }, { threshold: Math.min(0.4, 0.6 * innerHeight / Math.max(1, root.getBoundingClientRect().height)) });
  return { destroy() { arm.destroy(); seen.destroy(); finish(); } };
}

// the film look: the picture itself, from a pale flat grey print to the photograph (moment.css holds the
// start under .is-armed from just before the frame scrolls in, so a frame no observer reports keeps its photograph)
function film(root, img, opts, lib) {
  const dur = Math.max(1000, +opts.duration || 1600);
  let done = false, anim = null;
  root.classList.add('mo-pd--film');
  const finish = () => { if (done) return; done = true; anim?.cancel(); root.classList.remove('is-armed', 'is-live'); root.classList.add('is-done'); };
  const arm = () => { if (!done) root.classList.add('is-armed'); };
  const run = async () => {
    if (done) return;
    arm();
    try { if (!img.complete) await new Promise(r => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); }); } catch { /* shows anyway */ }
    if (done) return;
    root.classList.add('is-live');
    // the darks come first (contrast), the colour last (saturation); the zoom settles over the whole run.
    // The change starts on the first frame and runs evenly to a soft landing: a print that sat still for
    // half a second would read as a picture still loading
    anim = img.animate([
      { filter: 'grayscale(1) contrast(.55) brightness(1.32)', transform: 'scale(1.06)' },
      { filter: 'grayscale(.8) contrast(.82) brightness(1.14)', offset: 0.3 },
      { filter: 'grayscale(.35) contrast(.95) brightness(1.04)', offset: 0.62 },
      { filter: 'grayscale(0) contrast(1) brightness(1)', transform: 'none' },
    ], { duration: dur, easing: 'cubic-bezier(.3, .2, .3, 1)', fill: 'both' });
    root.classList.remove('is-armed');
    anim.finished.then(finish, finish);
  };
  const r0 = root.getBoundingClientRect();
  if (r0.bottom > 0 && r0.top < innerHeight * 1.25) arm();
  const near = lib.once(root, arm, { threshold: 0, margin: '0px 0px 25% 0px' });
  // it develops once a quarter of it is on screen (less of a frame taller than half the screen), so the
  // faint print is seen only briefly before it starts to change
  const seen = lib.once(root, run, { threshold: Math.min(0.25, 0.4 * innerHeight / Math.max(1, r0.height)) });
  return { destroy() { near.destroy(); seen.destroy(); finish(); } };
}

return { phone: phone, default: mount };
})();

var MODS = { 'photo-chapters': photoChapters, 'word-highlight': wordHighlight, 'picture-develops': pictureDevelops };
var html = document.documentElement;
function mountOne(el) {
  var m = MODS[el.dataset.moment];
  if (!m) return;
  try {
    var opts = {};
    try { opts = JSON.parse(el.dataset.momentOpts || '{}'); } catch (e) {}
    var onPhone = m.phone === true;
    var why = onPhone ? (lib.reduced() ? 'reduced' : '') : lib.stillWhy();
    if (why) el.dataset.momentStill = why;
    var mlib = Object.assign({}, lib, { reduced: function () { return onPhone ? lib.reduced() : lib.still(); } });
    el.__moment = m.default(el, opts, mlib) || {};
    el.dataset.momentMounted = '1';
  } catch (e) {
    console.warn('momento ' + el.dataset.moment + ' falló: ' + e.message);
    el.classList.add('mo-safe'); el.classList.remove('is-live'); el.classList.add('is-done');
  }
}
html.classList.add('mo-js');
setTimeout(function () { html.classList.add('mo-safe'); }, 2500);
function start() {
  var els = document.querySelectorAll('[data-moment]');
  els.forEach(mountOne);
  html.dataset.momentsReady = String(els.length);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();

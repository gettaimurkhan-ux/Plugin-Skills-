#!/usr/bin/env node
// Cloud slide renderer for the Law Firm SEO & Content product.
//
//   node renderer/render.js <carousel.json> [--out <dir>] [--theme <theme.json>]
//                           [--client <id>] [--fonts-dir <dir>] [--no-web-fonts]
//                           [--allow-fallback-fonts]
//
// Reads one carousel (JSON) and the client's theme (clients/<client>/theme.json),
// writes slide-01.png ... (one per slide), one PDF with a page per slide, and
// render.json. Exit code: 0 = clean, 1 = a hard rule is broken, 2 = bad input.
//
// This file holds no client values. Colours, fonts, sizes and fixed text all
// come from the theme file. It needs Node 18+ and Playwright with Chromium.
//
// Slide 1 is drawn as an editorial cover ("The Advisory Brief" for Pextrade Law)
// when the cover slide says layout "advisory_brief", or when it names no layout
// and the theme's covers.advisory_brief.use_for lists the post's category. The
// layout is in this file; its colours, fixed words and limits are in the theme.

'use strict';
const fs = require('fs');
const path = require('path');

const VERSION = '1.3.0';
const REPO_ROOT = path.resolve(__dirname, '..');
let FONT_DIR = path.join(__dirname, 'fonts');

// ───────────────────────────── arguments ─────────────────────────────

function parseArgs(argv) {
  const a = { flags: {}, input: null };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--out' || v === '--theme' || v === '--client' || v === '--fonts-dir') a.flags[v.slice(2)] = argv[++i];
    else if (v === '--no-web-fonts') a.flags.noWebFonts = true;
    else if (v === '--allow-fallback-fonts') a.flags.allowFallbackFonts = true;
    else if (v === '--help' || v === '-h') a.flags.help = true;
    else if (!a.input) a.input = v;
    else fail(`Unexpected argument: ${v}`);
  }
  return a;
}

function fail(msg) {
  console.error(`render: ${msg}`);
  process.exit(2);
}

// ───────────────────────────── small helpers ─────────────────────────

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Text from the carousel file: escaped, *word* becomes the accent word, line breaks kept.
const rich = (s) => esc(s).replace(/\*(.+?)\*/g, '<em class="accent">$1</em>').replace(/\n/g, '<br>');

const plain = (s) => String(s == null ? '' : s).replace(/\*(.+?)\*/g, '$1');
const wordCount = (s) => (plain(s).trim().match(/\S+/g) || []).length;
// For the cover's word budgets: a separator such as the middle dot is not a word.
const realWords = (s) => (plain(s).trim().match(/\S+/g) || []).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'untitled';
const pad2 = (n) => String(n).padStart(2, '0');
const normHex = (h) => {
  let x = String(h).trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(x)) x = '#' + x.slice(1).split('').map((c) => c + c).join('');
  return x;
};

function fontStack(spec, useBrand) {
  const q = (f) => (/^(serif|sans-serif|monospace)$/.test(f) ? f : `'${f}'`);
  const list = [...(useBrand && spec.family ? [spec.family] : []), ...(spec.fallback || [])];
  return list.map(q).join(', ');
}

// ───────────────────────────── theme ─────────────────────────────────

function loadTheme(file) {
  if (!fs.existsSync(file)) fail(`Theme file not found: ${file}`);
  const t = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const k of ['canvas', 'palette', 'fonts', 'slide_themes', 'sequence', 'layout', 'type', 'fixed_text', 'closing', 'rules']) {
    if (!t[k]) fail(`Theme ${file} has no "${k}" section`);
  }
  return t;
}

// A colour in the theme is a palette name. A raw hex is allowed through here on
// purpose: the palette check on the rendered slides is what rejects it.
function makeColour(theme) {
  return (ref) => {
    if (ref == null) return 'transparent';
    if (theme.palette[ref]) return theme.palette[ref];
    if (/^#[0-9a-fA-F]{3,8}$/.test(ref)) return ref;
    fail(`Theme colour "${ref}" is neither a palette name nor a hex value`);
  };
}

// Breaches that can be found in the theme itself, before anything is drawn.
function checkTheme(theme) {
  const out = [];
  const forbidden = new Set((theme.forbidden_colours || []).map(normHex));
  for (const [name, hex] of Object.entries(theme.palette)) {
    if (forbidden.has(normHex(hex))) {
      out.push({ rule: 'colour_forbidden', slide: null, message: `Palette colour "${name}" (${hex}) is on the theme's forbidden list` });
    }
  }
  for (const [id, cover] of Object.entries(theme.covers || {})) {
    if (!cover || typeof cover !== 'object') continue;
    for (const [name, hex] of Object.entries(cover.colours || {})) {
      if (forbidden.has(normHex(hex))) {
        out.push({ rule: 'colour_forbidden', slide: 1, message: `Cover "${id}" colour "${name}" (${hex}) is on the theme's forbidden list` });
      }
    }
  }
  return out;
}

// ───────────────────────────── input ─────────────────────────────────

// Watch Tower wrote { subject, hook, slide_2..slide_5:{headline, body}, cta_line }.
// generate-pdf.py turned that into 7 slides; this does the same.
function fromWatchTower(raw, theme) {
  const wt = (theme.legacy_input || {}).watchtower || {};
  const labels = wt.labels || {};
  const slides = [{ type: 'cover', headline: raw.hook, subline: raw.subject }];
  for (const key of ['slide_2', 'slide_3', 'slide_4', 'slide_5']) {
    const s = raw[key] || {};
    slides.push({ type: 'body', eyebrow: labels[key] || '', headline: s.headline, body: s.body });
  }
  slides.push({ type: 'body', eyebrow: labels.slide_6 || '', headline: raw.cta_line, body: '' });
  slides.push({ type: 'closing' });
  return {
    client: raw.client,
    title: raw.title || raw.subject,
    category: raw.category || wt.category || '',
    date: (raw.posted_at || raw.date || '').slice(0, 10),
    source: { shape: 'watchtower', account: raw.account, source_url: raw.source_url, library_page_id: raw.library_page_id },
    slides,
  };
}

function normaliseInput(raw, theme) {
  const c = Array.isArray(raw.slides) ? raw : (raw.hook && raw.slide_2 ? fromWatchTower(raw, theme) : null);
  if (!c) fail('Input has neither "slides" (standard shape) nor "hook" + "slide_2" (Watch Tower shape)');
  if (!c.title) fail('Input has no "title"');
  c.slides = c.slides.map((s) => ({ ...s, type: s.type || 'body' }));
  return c;
}

// Rules that depend only on the text (no browser needed).
function checkContent(c, theme, cover) {
  const out = [];
  const R = theme.rules;
  const n = c.slides.length;
  if (R.slide_count && n !== R.slide_count) {
    out.push({ rule: 'slide_count', slide: null, message: `Carousel has ${n} slides; the scheme requires ${R.slide_count}` });
  }
  if (R.first_slide && (!n || c.slides[0].type !== R.first_slide)) {
    out.push({ rule: 'missing_cover', slide: 1, message: `Slide 1 must be a "${R.first_slide}" slide` });
  }
  if (R.last_slide && (!n || c.slides[n - 1].type !== R.last_slide)) {
    out.push({ rule: 'missing_closing', slide: n || null, message: `The last slide must be a "${R.last_slide}" slide; it is missing` });
  }
  c.slides.forEach((s, i) => {
    const num = i + 1;
    if (!['cover', 'body', 'closing'].includes(s.type)) {
      out.push({ rule: 'unknown_slide_type', slide: num, message: `Unknown slide type "${s.type}"` });
      return;
    }
    if (s.type === 'closing') {
      if (i !== n - 1) out.push({ rule: 'closing_position', slide: num, message: 'A closing slide may only be the last slide' });
      return;
    }
    if (!plain(s.headline).trim()) out.push({ rule: 'missing_text', slide: num, message: `Slide ${num} has no headline` });
    for (const field of ['headline', 'subline', 'eyebrow', 'body']) {
      const text = s[field];
      if (text == null || text === '') continue;
      const limit = (R.max_words || {})[`${s.type}.${field}`];
      const words = wordCount(text);
      if (limit && words > limit) {
        out.push({ rule: 'word_limit', slide: num, message: `Slide ${num} ${field} has ${words} words; the limit is ${limit}` });
      }
      for (const bad of R.forbidden_text || []) {
        if (String(text).includes(bad)) {
          out.push({ rule: 'forbidden_text', slide: num, message: `Slide ${num} ${field} contains "${bad}", which the scheme does not allow` });
        }
      }
    }
  });
  if (cover) out.push(...checkCoverContent(c.slides[0], theme, cover));
  return out;
}

// ───────────────────────────── editorial cover: input ────────────────

// The cover templates the renderer can draw, and the colours each needs from the theme.
const COVER_COLOURS = {
  advisory_brief: ['paper', 'oxblood', 'brass', 'ink'],
  cutout_card: ['paper', 'oxblood', 'brass', 'ink', 'body', 'muted'],
};

// Which cover slide 1 gets. null = the theme's ordinary cover.
function pickCover(c, theme) {
  const s = c.slides[0];
  if (!s || s.type !== 'cover') return null;
  const covers = Object.entries(theme.covers || {}).filter(([id, v]) => !id.startsWith('_') && v && typeof v === 'object');
  let hit = null; let why = '';
  if (s.layout != null && s.layout !== '') {
    if (s.layout === 'standard') return null;
    hit = covers.find(([id]) => id === s.layout);
    if (!hit) fail(`Slide 1 asks for layout "${s.layout}" but the theme has no such cover (covers: ${covers.map(([id]) => id).join(', ') || 'none'})`);
    why = `layout "${s.layout}" on the cover slide`;
  } else {
    hit = covers.find(([, v]) => Array.isArray(v.use_for) && v.use_for.includes(c.category));
    if (!hit) return null;
    why = `the theme uses it for ${c.category} posts`;
  }
  const spec = hit[1];
  // A cover is drawn by its template: the cover's own id unless the theme names one.
  const template = spec.template || hit[0];
  if (!COVER_COLOURS[template]) fail(`The renderer cannot draw the cover layout "${hit[0]}"${template !== hit[0] ? ` (template "${template}")` : ''}`);
  for (const k of COVER_COLOURS[template]) if (!(spec.colours || {})[k]) fail(`Theme cover "${hit[0]}" has no colour "${k}"`);
  if (theme.canvas.width !== 1080 || theme.canvas.height !== 1350) fail(`The "${hit[0]}" cover is laid out for a 1080x1350 canvas`);
  return { id: hit[0], spec, why, template };
}

// The cover's own text rules. writer/check.js checks the same things (COV-1 to COV-5);
// they are repeated here because the renderer also draws files that never saw check.js.
function checkCoverContent(s, theme, cover) {
  const out = [];
  const A = cover.spec;
  const M = A.max_words || {};
  const add = (rule, message) => out.push({ rule, slide: 1, message: `Slide 1 (${cover.id} cover): ${message}` });
  const limit = (label, text, max) => {
    const n = realWords(text);
    if (max && n > max) add('word_limit', `${label} has ${n} words; the limit is ${max}`);
  };
  const forbid = (label, text) => {
    for (const bad of theme.rules.forbidden_text || []) if (String(text || '').includes(bad)) add('forbidden_text', `${label} contains "${bad}", which the scheme does not allow`);
  };
  if (cover.template === 'cutout_card') {
    const N = A.min_words || {};
    const range = (label, text, key) => {
      const n = realWords(text);
      if (M[key] && n > M[key]) add('word_limit', `${label} has ${n} words; the limit is ${M[key]}`);
      else if (N[key] && n < N[key]) add('word_limit', `${label} has ${n} words; it needs at least ${N[key]}`);
    };
    if (!String(s.lead_in || '').trim()) add('cover_fields', 'no lead_in (the short italic line above the headline)');
    else { range('the lead-in', s.lead_in, 'lead_in'); forbid('the lead-in', s.lead_in); }
    range('the headline', s.headline, 'headline');
    if (!plain(s.subline).trim()) add('cover_fields', 'no subline (the summary under the headline)');
    else range('the summary (subline)', s.subline, 'summary');
    return out;
  }
  limit('the headline', s.headline, M.headline);
  limit('the deck (subline)', s.subline, M.deck);
  if (!String(s.topic_tag || '').trim()) add('cover_fields', 'no topic_tag');
  else {
    limit('the topic tag', s.topic_tag, M.topic_tag);
    forbid('the topic tag', s.topic_tag);
    const parts = String(s.topic_tag).split('·').filter((p) => p.trim()).length;
    if (M.topic_tag_parts && parts > M.topic_tag_parts) add('word_limit', `the topic tag has ${parts} parts; the limit is ${M.topic_tag_parts}`);
  }
  const want = A.strip_entries || 3;
  if (!Array.isArray(s.strip)) add('cover_fields', 'no strip');
  else {
    if (s.strip.length !== want) add('cover_fields', `the strip has ${s.strip.length} entries; it must have exactly ${want}`);
    s.strip.slice(0, want).forEach((e, i) => {
      for (const f of ['label', 'figure', 'detail']) {
        const text = e && typeof e === 'object' ? e[f] : '';
        if (!String(text || '').trim()) { add('cover_fields', `strip entry ${i + 1} has no ${f}`); continue; }
        limit(`strip entry ${i + 1} ${f}`, text, M[`strip_${f}`]);
        forbid(`strip entry ${i + 1} ${f}`, text);
      }
    });
  }
  if (s.highlight != null && s.highlight !== '') {
    const found = plain(s.headline).split(String(s.highlight)).length - 1;
    if (found !== 1) add('cover_fields', `the highlight "${s.highlight}" occurs ${found} times in the headline; it must occur exactly once`);
    const max = A.highlight_max_words || 3;
    if (realWords(s.highlight) > max) add('word_limit', `the highlight has ${realWords(s.highlight)} words; the limit is ${max}`);
  }
  return out;
}

// The artwork is read from disk and carried inside the page, so the PNG and the PDF both hold it.
// The path is taken relative to the input file. Anything that goes wrong is said, never hidden:
// the box is then drawn with the seal and the report says "no artwork".
function loadArt(s, inputFile) {
  const art = s.art && typeof s.art === 'object' ? s.art : null;
  if (!art || !String(art.file || '').trim()) return { status: 'no artwork', file: null, note: 'the cover slide names no artwork file' };
  const file = path.resolve(path.dirname(path.resolve(inputFile)), String(art.file));
  let buf;
  try { buf = fs.readFileSync(file); } catch (e) { return { status: 'no artwork', file, note: `the artwork file could not be read (${e.code || e.message})` }; }
  const mime = buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47 ? 'image/png' : (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff ? 'image/jpeg' : null);
  if (!mime) return { status: 'no artwork', file, note: 'the artwork file is not a PNG or a JPG' };
  return { status: 'embedded', file, note: '', mime, bytes: buf.length, alt: String(art.alt || ''), source: art.source || null, uri: `data:${mime};base64,${buf.toString('base64')}` };
}

function longDate(iso, locale) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale || 'en-CA', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

// ───────────────────────────── fonts ─────────────────────────────────

const WEIGHT_WORDS = [
  ['extralight', 200], ['ultralight', 200], ['semibold', 600], ['demibold', 600], ['extrabold', 800], ['ultrabold', 800],
  ['thin', 100], ['light', 300], ['regular', 400], ['medium', 500], ['bold', 700], ['black', 900], ['heavy', 900],
];
const FORMATS = { '.woff2': 'woff2', '.woff': 'woff', '.ttf': 'truetype', '.otf': 'opentype' };

// Font files are matched by name: "PlayfairDisplay-BlackItalic.ttf" is family
// Playfair Display, weight 900, italic. A file with "Variable" or "wght" in its
// name covers every weight.
function scanLocalFonts(required) {
  const families = [...new Set(required.map((f) => f.family))];
  const faces = [];
  if (!fs.existsSync(FONT_DIR)) return faces;
  for (const file of fs.readdirSync(FONT_DIR).sort()) {
    const ext = path.extname(file).toLowerCase();
    if (!FORMATS[ext]) continue;
    const key = file.toLowerCase().replace(/[^a-z0-9]/g, '');
    const family = families.find((f) => key.startsWith(f.toLowerCase().replace(/[^a-z0-9]/g, '')));
    if (!family) continue;
    const rest = key.slice(family.replace(/[^a-zA-Z0-9]/g, '').length);
    const style = rest.includes('italic') ? 'italic' : 'normal';
    let weight = 400;
    if (/variable|wght/.test(rest)) weight = '100 900';
    else { const w = WEIGHT_WORDS.find(([word]) => rest.includes(word)); if (w) weight = w[1]; }
    faces.push({ family, style, weight, file, format: FORMATS[ext] });
  }
  return faces;
}

const showDir = (d) => { const r = path.relative(REPO_ROOT, d); return (r && !r.startsWith('..') ? r : d) + '/'; };
const covers = (face, need) => face.family === need.family && face.style === need.style &&
  (face.weight === need.weight || face.weight === '100 900');

// An editorial cover may name its own faces (covers.<id>.fonts); they are asked for with the theme's.
function planFonts(theme, flags, cover) {
  const extra = (cover && cover.spec.fonts) || {};
  const required = [...theme.fonts.required_faces, ...(extra.required_faces || [])];
  const urls = [theme.fonts.web_css_url, extra.web_css_url].filter(Boolean);
  const local = scanLocalFonts(required);
  const missingLocal = required.filter((need) => !local.some((f) => covers(f, need)));
  const label = (f) => `${f.family} ${f.weight}${f.style === 'italic' ? ' italic' : ''}`;
  if (local.length && !missingLocal.length) {
    const css = local.map((f) => {
      const data = fs.readFileSync(path.join(FONT_DIR, f.file)).toString('base64');
      return `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};` +
        `src:url(data:font/${path.extname(f.file).slice(1)};base64,${data}) format('${f.format}');}`;
    }).join('\n');
    return { source: 'local-files', css, link: '', useBrand: true, required, files: local.map((f) => f.file), note: `Font files from ${showDir(FONT_DIR)}` };
  }
  const where = showDir(FONT_DIR);
  const localNote = local.length ? `${where} is incomplete (no file for: ${missingLocal.map(label).join(', ')}). ` : `No font files in ${where}. `;
  if (!flags.noWebFonts && urls.length) {
    return { source: 'web', css: '', link: urls.map((u) => `<link rel="stylesheet" href="${esc(u)}">`).join('\n'), useBrand: true, required, files: [], note: `${localNote}Web fonts requested from ${[...new Set(urls.map((u) => new URL(u).host))].join(', ')}` };
  }
  return { source: 'system-fallback', css: '', link: '', useBrand: false, required, files: [], note: `${localNote}Web fonts switched off. Using system fallback fonts` };
}

// ───────────────────────────── HTML ──────────────────────────────────

function buildCss(theme, fonts) {
  const C = makeColour(theme);
  const { width: W, height: H } = theme.canvas;
  const L = theme.layout;
  const T = theme.type;
  const stack = (role) => fontStack(theme.fonts[role], fonts.useBrand);
  const text = (sel, t, extra = '') => `${sel}{font-family:${stack(t.font)};font-weight:${t.weight};font-size:${t.size}px;` +
    (t.line_height ? `line-height:${t.line_height};` : '') + (t.letter_spacing ? `letter-spacing:${t.letter_spacing};` : '') +
    (t.uppercase ? 'text-transform:uppercase;' : '') + (t.style ? `font-style:${t.style};` : '') +
    (t.margin_bottom != null ? `margin-bottom:${t.margin_bottom}px;` : '') + (t.margin_top != null ? `margin-top:${t.margin_top}px;` : '') + extra + '}';

  let css = `
@page{margin:0;}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{width:${W}px;background:${C(theme.slide_themes[theme.sequence[0]].background)};-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body{font-family:${stack('body')};}
.slide{width:${W}px;height:${H}px;position:relative;overflow:hidden;break-after:page;page-break-after:always;padding:${L.padding.y}px ${L.padding.x}px;display:flex;flex-direction:column;justify-content:center;}
.slide:last-child{break-after:auto;page-break-after:auto;}
.brand-mark{position:absolute;top:${L.brand_mark.top}px;left:${L.brand_mark.left}px;}
.slide-counter{position:absolute;top:${L.counter.top}px;right:${L.counter.right}px;}
.swipe-cta{position:absolute;bottom:${L.swipe.bottom}px;right:${L.swipe.right}px;}
.handle{position:absolute;bottom:${theme.canvas.safe_margin.bottom}px;left:${L.brand_mark.left}px;}
${text('.brand-mark', T.brand_mark)}
${text('.slide-counter', T.counter)}
${text('.swipe-cta', T.swipe)}
${text('.handle', T.handle)}
${text('h1', T.cover_headline)}
${text('.subline', T.cover_subline)}
${text('.eyebrow', T.eyebrow)}
${text('h2', T.headline)}
${text('p.body', T.body)}
em.accent{font-style:${T.accent_word.style};font-weight:${T.accent_word.weight};}
.symbols{font-family:${fontStack(theme.fonts.symbols, false)};}
`;
  for (const [name, t] of Object.entries(theme.slide_themes)) {
    css += `.t-${name}{background:${C(t.background)};color:${C(t.text)};}
.t-${name} .brand-mark{color:${C(t.brand_mark)};}
.t-${name} .slide-counter{color:${C(t.counter)};}
.t-${name} .eyebrow{color:${C(t.eyebrow)};}
.t-${name} em.accent{color:${C(t.accent)};}
.t-${name} .subline{color:${C(t.subline)};}
.t-${name} .swipe-cta{color:${C(t.swipe)};}
.t-${name} .handle{color:${C(t.text)};}
`;
  }
  for (const [name, g] of Object.entries(theme.tags || {})) {
    css += `.tag-${name}{font-family:${stack(g.font)};font-weight:${g.weight};font-size:${g.size}px;letter-spacing:${g.letter_spacing};` +
      `text-transform:uppercase;padding:${g.padding};margin-bottom:${g.margin_bottom}px;color:${C(g.text)} !important;` +
      (g.background ? `background:${C(g.background)};` : '') + (g.border ? `border:1px solid ${C(g.border)};` : '') + '}\n';
  }
  return css;
}

const sty = (o) => Object.entries(o).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}:${v}`).join(';');

function textStyle(theme, fonts, C, t) {
  return sty({
    'font-family': fontStack(theme.fonts[t.font || 'body'], fonts.useBrand),
    'font-style': t.style, 'font-weight': t.weight, 'font-size': t.size && `${t.size}px`,
    'line-height': t.line_height, 'letter-spacing': t.letter_spacing,
    'text-transform': t.uppercase ? 'uppercase' : null,
    color: t.colour && C(t.colour), opacity: t.opacity,
    'margin-bottom': t.margin_bottom != null ? `${t.margin_bottom}px` : null,
  });
}

function closingHtml(theme, fonts, variant, furniture) {
  const C = makeColour(theme);
  const v = theme.closing[variant];
  if (!v) fail(`Theme has no closing variant "${variant}"`);
  const ts = (t) => textStyle(theme, fonts, C, t);
  if (v.layout === 'cta') {
    return `<div class="slide t-${v.theme}" data-kind="closing" style="align-items:center;text-align:center;padding:${v.padding}px;">${furniture}
<div class="symbols" data-check data-font-role="symbols" style="${sty({ 'font-size': `${v.ornament.size}px`, 'letter-spacing': v.ornament.letter_spacing, 'margin-bottom': `${v.ornament.margin_bottom}px`, color: C(v.ornament.colour) })}">${esc(v.ornament.text).replace(/(\S)/g, '$1︎')}</div>
<div data-check data-font-role="display" style="${ts(v.headline)}">${esc(v.headline.text)}</div>
<div style="${sty({ width: `${v.rule.width}px`, height: `${v.rule.height}px`, background: C(v.rule.colour), margin: v.rule.margin })}"></div>
${v.button ? `<div data-check data-font-role="body" style="${ts(v.button)};${sty({ background: C(v.button.background), padding: v.button.padding, margin: v.button.margin })}">${esc(v.button.text)}</div>` : ''}
<div data-check data-font-role="body" style="${ts(v.contact)}">${esc(v.contact.text)}</div>
</div>`;
  }
  if (v.layout === 'diamond') {
    const d = v.diamond;
    const ring = (inset, extra) => `<div style="position:absolute;inset:${inset}px;transform:rotate(45deg);${extra}"></div>`;
    const rgba = (hex, a) => { const h = normHex(hex); return `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`; };
    const dis = v.disclaimer;
    return `<div class="slide t-${v.theme}" data-kind="closing" style="justify-content:space-between;">${furniture}
<div style="flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:${v.gap}px;${v.content_width ? `width:${v.content_width}px;max-width:100%;align-self:center;` : ''}">
<div style="position:relative;width:${d.size}px;height:${d.size}px;margin-bottom:${d.margin_bottom}px;">
${ring(0, `border:${d.outer.stroke}px solid ${C(d.outer.colour)};`)}${ring(d.mid.inset, `border:${d.mid.stroke}px solid ${C(d.mid.colour)};`)}${ring(d.centre.inset, `background:${C(d.centre.colour)};`)}
</div>
<div data-check data-font-role="display" style="${ts(v.name)}">${esc(v.name.text)}</div>
<div style="${sty({ width: `${v.rule.width}px`, height: `${v.rule.height}px`, background: C(v.rule.colour), margin: v.rule.margin })}"></div>
<div data-check data-font-role="body" style="${ts(v.tagline)}">${esc(v.tagline.text)}</div>
<div data-check data-font-role="display" style="${ts(v.headline)}">${esc(v.headline.text)}</div>
<div data-check data-font-role="body" style="${ts(v.contact)}">${esc(v.contact.text)}</div>
</div>
<div style="border-top:${dis.rule_height}px solid ${rgba(C(dis.rule_colour), dis.rule_opacity)};padding-top:${dis.padding_top}px;text-align:center;">
<span data-check data-font-role="body" style="${ts(dis)}">${esc(dis.text)}</span>
</div>
</div>`;
  }
  fail(`Closing variant "${variant}" has unknown layout "${v.layout}"`);
}

// ───────────────────────────── editorial cover: HTML ─────────────────

// The advisory_brief layout, in px on the 1080x1350 canvas. Ported from
// renderer/covers/advisory-brief.reference.html. Colours, fixed words and limits are the theme's.
const AB = {
  body_top: 338,        // top of the topic tag and of the artwork box when there is a motto
  motto_room: 34,       // with no motto, everything between the band and the strip moves up by this much
  text_width: 524,      // the headline column ends where the seal begins
  strip_top: 912,
  column_min: 180,      // a wide figure may take room from the other two columns, but their text keeps this width
  text_gap: 44,         // clear space kept between the deck and the rule above the strip
  foot_rule: 1256,
  strip_gap: 20,        // clear space kept between the strip and the rule above the footer
  brush_opacity: 0.78,
};
// How the cover's type and marks are drawn. A theme's covers.<id>.style overrides any of these;
// with none, the cover is drawn as it was first designed (heavy display face, brush highlight).
const AB_STYLE = {
  grain: true,                // paper grain over the whole slide
  highlight: 'brush',         // brush (dry-brush strokes behind the words) | italic (the words in italic, in oxblood) | rule (a thin line under the words)
  arrow: 'sketch',            // sketch (hand-drawn outline) | plain (a thin straight arrow)
  artwork_tone: 'colour',     // colour (as supplied) | mono (drawn in grey)
  seal: true,                 // the round monogram over the corner of the artwork box
  detail_font: 'body',        // body | display: the face of the strip's detail lines
  masthead: { weight: 700, size: 92, tracking: 3 },
  headline: { weight: 900, line_height: 1.06, tracking: 0 },
  deck: { weight: 700, size: 27 },
  figure: { weight: 900, tracking: 0 },
  detail: { weight: 400, size: 23 },
};
function abStyle(spec) {
  const st = spec.style || {};
  const out = { ...AB_STYLE, ...st };
  for (const k of ['masthead', 'headline', 'deck', 'figure', 'detail']) out[k] = { ...AB_STYLE[k], ...(st[k] || {}) };
  return out;
}
const AB_PILLAR = '<path d="M25 22h30M27 22c0 4 3 5 3 5h20s3-1 3-5"/><path d="M31 27v25M36 27v25M40 27v25M44 27v25M49 27v25"/><path d="M29 52h22M26 57h28M24 61h32"/>';

function advisoryBriefCss(theme, fonts, cover) {
  const K = cover.spec.colours;
  const S = abStyle(cover.spec);
  const display = fontStack((cover.spec.fonts || {}).display || theme.fonts.display, fonts.useBrand);
  const body = fontStack(theme.fonts.body, fonts.useBrand);
  const top = AB.body_top - (String((cover.spec.text || {}).motto || '').trim() ? 0 : AB.motto_room);
  const n = cover.spec.strip_entries || 3;
  const grain = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>";
  return `
.slide.ab{padding:0;display:block;background:${K.paper};color:${K.ink};font-family:${body};}
.ab .abs{position:absolute;}
.ab .caps{text-transform:uppercase;font-weight:700;}
.ab-grain{position:absolute;inset:0;opacity:.03;pointer-events:none;background-image:url("${grain}");}
.ab-top{top:50px;font-size:15px;letter-spacing:3.4px;white-space:nowrap;}
.ab-l{left:60px;}.ab-r{right:60px;}
.ab-rule{left:60px;right:60px;background:${K.ink};}
.ab-mast{top:92px;left:0;right:0;text-align:center;font-family:${display};font-weight:${S.masthead.weight};font-size:${S.masthead.size}px;letter-spacing:${S.masthead.tracking}px;color:${K.oxblood};line-height:${(101 / S.masthead.size).toFixed(4)};white-space:nowrap;}
.ab-band{top:219px;left:0;right:0;text-align:center;font-size:14px;letter-spacing:4.6px;white-space:nowrap;}
.ab-motto{top:272px;left:0;right:0;text-align:center;font-size:13px;letter-spacing:4.2px;color:${K.brass};white-space:nowrap;}
.ab-tag{top:${top}px;font-size:15px;letter-spacing:3.6px;color:${K.brass};white-space:nowrap;}
.ab-head{top:${top + 34}px;left:60px;width:${AB.text_width}px;}
.ab-h{position:relative;z-index:0;font-family:${display};font-weight:${S.headline.weight};font-size:65px;line-height:${S.headline.line_height};letter-spacing:${S.headline.tracking}px;color:${K.ink};}
${S.highlight === 'italic' ? `.ab-hl{font-style:italic;color:${K.oxblood};}` : ''}${S.highlight === 'rule' ? `.ab-hl{box-shadow:inset 0 -3px 0 ${K.brass};}` : ''}
.ab-brush{position:absolute;z-index:-1;overflow:visible;}
.ab-deck{font-family:${display};font-style:italic;font-weight:${S.deck.weight};font-size:${S.deck.size}px;color:${K.oxblood};margin-top:24px;line-height:1.3;}
.ab-panel{top:${top}px;left:618px;width:402px;height:508px;background:${K.oxblood};overflow:hidden;}
.ab-panel img{width:100%;height:100%;object-fit:cover;display:block;${S.artwork_tone === 'mono' ? 'filter:grayscale(1) contrast(1.08);' : ''}}
.ab-noart{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
.ab-noart[hidden]{display:none;}
.ab-inner{position:absolute;inset:14px;border:1px solid ${K.brass};}
.ab-noart svg{width:220px;height:220px;}
.ab-seal{top:${top + 468}px;left:584px;width:78px;height:78px;}
.ab-cols{top:${AB.strip_top}px;left:60px;right:60px;min-height:250px;border-top:1px solid ${K.ink};display:grid;grid-template-columns:repeat(${n},1fr);}
.ab-cols>div{padding:44px 22px 0 28px;border-left:1px solid ${K.ink};}
.ab-cols>div::before{content:"";display:block;height:0;width:${AB.column_min}px;}
.ab-cols>div:first-child{border-left:0;padding-left:0;}
.ab-lab{font-size:14px;letter-spacing:3.4px;color:${K.brass};}
.ab-big{font-family:${display};font-weight:${S.figure.weight};letter-spacing:${S.figure.tracking}px;font-size:74px;color:${K.oxblood};line-height:1.1;margin-top:12px;white-space:nowrap;}
.ab-det{${S.detail_font === 'display' ? `font-family:${display};` : ''}font-weight:${S.detail.weight};font-size:${S.detail.size}px;line-height:1.45;margin-top:8px;color:${K.ink};}
.ab-foot{top:1284px;font-size:15px;letter-spacing:3.4px;color:${K.oxblood};white-space:nowrap;}
.ab-arrow{top:1268px;right:56px;width:74px;height:46px;}
`;
}

// The headline with each highlighted word in its own span. The brush strokes are added in the
// page once the lines are known (fitCover), one stroke per line the highlight sits on.
function highlightHtml(headline, highlight) {
  const text = plain(headline);
  const br = (x) => esc(x).replace(/\n/g, '<br>');
  const hl = highlight == null ? '' : String(highlight);
  if (!hl.trim() || text.split(hl).length !== 2) return br(text);
  const at = text.indexOf(hl);
  const marked = hl.split(/(\s+)/).map((w) => (/\S/.test(w) ? `<span class="ab-hl">${esc(w)}</span>` : br(w))).join('');
  return br(text.slice(0, at)) + marked + br(text.slice(at + hl.length));
}

function advisoryBriefHtml(c, s, cover, art) {
  const A = cover.spec;
  const K = A.colours;
  const X = A.text || {};
  const motto = String(X.motto || '').trim();
  const S = abStyle(A);
  const own = !!(A.fonts && A.fonts.display);   // the cover's own display face is reported as its own role
  const text = (name, role) => `data-ab="${name}" data-ab-text data-font-role="${role === 'display' && own ? 'cover_display' : role}"`;
  const rule = (y, h) => `<div class="abs ab-rule" data-ab="rule at ${y}px" style="top:${y}px;height:${h}px"></div>`;
  const seal = (attrs, disc, w) => `<svg ${attrs} viewBox="0 0 80 80">${disc ? `<circle cx="40" cy="40" r="38" fill="${K.paper}"/>` : ''}` +
    `<circle cx="40" cy="40" r="35" fill="none" stroke="${K.brass}" stroke-width="${w}"/><circle cx="40" cy="40" r="30" fill="none" stroke="${K.brass}" stroke-width="${w * 0.4}"/>` +
    `<g fill="none" stroke="${K.brass}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${AB_PILLAR}</g></svg>`;
  const dry = (i, seed) => `<filter id="ab-dry-${i}" x="-5%" y="-30%" width="110%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.02 1.4" numOctaves="2" seed="${seed}" result="s"/>` +
    '<feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -9 6.4" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="c"/>' +
    `<feTurbulence type="fractalNoise" baseFrequency="0.035 0.9" numOctaves="3" seed="${seed + 4}" result="t"/><feDisplacementMap in="c" in2="t" scale="14" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  const want = A.strip_entries || 3;
  const strip = Array.from({ length: want }, (_, i) => ((Array.isArray(s.strip) ? s.strip : [])[i]) || {});
  const cols = strip.map((e, i) => `<div><div class="ab-lab caps" ${text(`strip ${i + 1} label`, 'body')}>${esc(e.label)}</div>` +
    `<div class="ab-big" ${text(`strip ${i + 1} figure`, 'display')}>${esc(e.figure)}</div>` +
    `<div class="ab-det" ${text(`strip ${i + 1} detail`, S.detail_font === 'display' ? 'display' : 'body')}>${esc(e.detail)}</div></div>`).join('');
  const date = longDate(c.date, A.date_locale);
  return `<div class="slide ab" data-kind="cover" data-cover="${cover.id}">
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${dry(0, 3)}${dry(1, 11)}${dry(2, 23)}
<filter id="ab-sketch"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="2.2"/></filter>
</defs></svg>
<div class="abs ab-l ab-top caps" ${text('firm and category', 'body')}>${esc([X.firm, c.category].filter(Boolean).join(' · '))}</div>
${date ? `<div class="abs ab-r ab-top caps" ${text('date', 'body')}>${esc(date)}</div>` : ''}
${rule(84, 2)}
<div class="abs ab-mast" ${text('masthead', 'display')}>${esc(X.masthead)}</div>
${rule(204, 1)}${rule(208, 1)}
<div class="abs ab-band caps" ${text('band', 'body')}>${esc(X.band)}</div>
${rule(250, 1)}${rule(254, 1)}
${motto ? `<div class="abs ab-motto caps" ${text('motto', 'body')}>${esc(motto)}</div>` : ''}
<div class="abs ab-l ab-tag caps" ${text('topic tag', 'body')}>${esc(s.topic_tag)}</div>
<div class="abs ab-head"><div class="ab-h" ${text('headline', 'display')}>${highlightHtml(s.headline, s.highlight)}</div>${s.subline ? `<div class="ab-deck" ${text('deck', 'display')}>${esc(plain(s.subline))}</div>` : ''}</div>
<div class="abs ab-panel" data-ab="artwork box">${art.uri ? `<img src="${art.uri}" alt="${esc(art.alt)}">` : ''}<div class="ab-noart"${art.uri ? ' hidden' : ''}><div class="ab-inner"></div>${seal('', false, 1.3)}</div></div>
${S.seal ? seal('class="abs ab-seal" data-ab="seal" data-ab-over="artwork box"', true, 2) : ''}
<div class="abs ab-cols" data-ab-strip>${cols}</div>
${rule(AB.foot_rule, 2)}
<div class="abs ab-l ab-foot caps" ${text('footer disclaimer', 'body')}>${esc(X.disclaimer)}</div>
<div class="abs ab-foot caps" style="right:142px" ${text('footer prompt', 'body')}>${esc(X.prompt)}</div>
${S.arrow === 'plain'
    ? `<svg class="abs ab-arrow" data-ab="arrow" viewBox="0 0 74 46"><path d="M8 23 H64 M52 12 L65 23 L52 34" fill="none" stroke="${K.oxblood}" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/></svg>`
    : `<svg class="abs ab-arrow" data-ab="arrow" viewBox="0 0 74 46"><path d="M5 18 L44 17 L43 7 L69 23 L44 39 L44 29 L6 30 Z" fill="none" stroke="${K.oxblood}" stroke-width="2.4" stroke-linejoin="round" filter="url(#ab-sketch)"/></svg>`}
${S.grain ? '<div class="ab-grain"></div>' : ''}
</div>`;
}

// ───────────────────────────── cutout cover: HTML ────────────────────

// The cutout_card layout (decision L13), in px on the 1080x1350 canvas. The frame is fixed: an
// oxblood card with rounded corners over the top of the slide, the monogram in its corner, the
// lead-in, headline and summary below, then the action row and the disclaimer. Only the
// artwork in the card and the three pieces of text change from post to post.
const CC = {
  text_left: 60,
  text_top_gap: 29,      // from the card's bottom edge to the lead-in
  text_width: 960,
  summary_width: 860,    // the summary ends left of the arrow circle
  prompt_top: 1224,
  circle: 84,
  circle_top: 1186,
  note_top: 1290,
  text_gap: 22,          // clear space kept between the summary and the action row
};

// The fallback picture when a post has no artwork: a classical facade standing on the card's
// bottom edge, drawn in line. Six columns, an entablature, a pediment and three steps.
function ccFacade(K) {
  const w = 520; const h = 400; const cols = 6; const colW = 34; const left = 62; const right = w - 62;
  const gap = (right - left - colW) / (cols - 1);
  let g = '';
  const line = `stroke="${K.ink}" stroke-width="1.6" stroke-linejoin="miter"`;
  // steps
  [[0, 372, w, 28], [16, 350, w - 32, 22], [32, 330, w - 64, 20]].forEach(([x, y, ww, hh]) => { g += `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="${K.paper}" ${line}/>`; });
  // columns: base, fluted shaft, capital
  for (let i = 0; i < cols; i++) {
    const x = left + i * gap;
    g += `<rect x="${x - 5}" y="320" width="${colW + 10}" height="10" fill="${K.paper}" ${line}/>`;
    g += `<rect x="${x}" y="150" width="${colW}" height="170" fill="${K.paper}" ${line}/>`;
    for (let f = 1; f < 5; f++) g += `<path fill="none" d="M${(x + f * colW / 5).toFixed(1)} 156V314" stroke="${K.ink}" stroke-width="0.9" opacity="0.55"/>`;
    g += `<rect x="${x - 6}" y="138" width="${colW + 12}" height="12" fill="${K.paper}" ${line}/>`;
  }
  // entablature and pediment
  g += `<rect x="40" y="112" width="${w - 80}" height="26" fill="${K.paper}" ${line}/>`;
  g += `<path fill="none" d="M48 125H${w - 48}" stroke="${K.ink}" stroke-width="0.9" opacity="0.55"/>`;
  g += `<path d="M28 112 L${w / 2} 14 L${w - 28} 112 Z" fill="${K.paper}" ${line}/>`;
  g += `<path d="M76 100 L${w / 2} 38 L${w - 76} 100 Z" fill="none" stroke="${K.ink}" stroke-width="1.1"/>`;
  g += `<circle cx="${w / 2}" cy="78" r="11" fill="none" stroke="${K.brass}" stroke-width="2"/>`;
  return `<svg class="cc-facade" viewBox="0 0 ${w} ${h}" aria-hidden="true">${g}</svg>`;
}

function cutoutCardCss(theme, fonts, cover) {
  const A = cover.spec; const K = A.colours;
  const serif = fontStack((A.fonts || {}).display || theme.fonts.display, fonts.useBrand);
  const sans = fontStack(theme.fonts.body, fonts.useBrand);
  const card = { inset: 36, height_percent: 58, radius: 20, ...(A.card || {}) };
  const grid = { size: 54, opacity: 0.06, ...(A.grid || {}) };
  const cardBottom = Math.round(theme.canvas.height * card.height_percent / 100);
  const ink = normHex(K.ink).slice(1).match(/../g).map((x) => parseInt(x, 16)).join(',');
  const gl = `rgba(${ink},${grid.opacity})`;
  return `
.slide.ab{padding:0;display:block;background:${K.paper};color:${K.ink};font-family:${sans};}
.ab .abs{position:absolute;}
.cc-grid{position:absolute;left:0;right:0;top:${cardBottom}px;bottom:0;background-image:linear-gradient(${gl} 1px,transparent 1px),linear-gradient(90deg,${gl} 1px,transparent 1px);background-size:${grid.size}px ${grid.size}px;background-position:center top;}
.cc-card{left:${card.inset}px;right:${card.inset}px;top:${card.inset}px;height:${cardBottom - card.inset}px;border-radius:${card.radius}px;background:${K.oxblood};overflow:hidden;}
.cc-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center bottom;display:block;}
.cc-noart{position:absolute;inset:0;}
.cc-noart[hidden]{display:none;}
.cc-sheet{position:absolute;bottom:-90px;width:330px;height:540px;background:${K.paper};opacity:.9;background-image:repeating-linear-gradient(${K.paper} 0 21px,rgba(${ink},.2) 21px 22px);background-position:0 96px;background-repeat:no-repeat;background-size:100% 400px;}
.cc-sheet::before{content:"";position:absolute;left:34px;right:120px;top:44px;height:9px;background:rgba(${ink},.5);}
.cc-sheet::after{content:"";position:absolute;inset:0;border:30px solid ${K.paper};}
.cc-sheet.l{left:50%;margin-left:-395px;transform:rotate(-13deg);transform-origin:bottom right;}
.cc-sheet.r{left:50%;margin-left:65px;transform:rotate(13deg);transform-origin:bottom left;}
.cc-facade{position:absolute;left:50%;bottom:0;width:680px;margin-left:-340px;display:block;}
.cc-mono{left:${card.inset + 34}px;top:${card.inset + 34}px;width:86px;height:86px;}
.cc-text{left:${CC.text_left}px;top:${cardBottom + CC.text_top_gap}px;width:${CC.text_width}px;}
.cc-lead{font-family:${serif};font-style:italic;font-weight:500;font-size:38px;line-height:1.26;color:${K.ink};white-space:nowrap;}
.cc-h{font-family:${sans};font-weight:800;font-size:78px;line-height:1.08;letter-spacing:-0.022em;color:${K.ink};margin-top:6px;}
.cc-sum{font-weight:400;font-size:26px;line-height:1.42;color:${K.body};margin-top:20px;width:${CC.summary_width}px;}
.cc-prompt{left:${CC.text_left}px;top:${CC.prompt_top}px;font-weight:700;font-size:28px;line-height:1.3;color:${K.brass};white-space:nowrap;}
.cc-circle{right:${CC.text_left}px;top:${CC.circle_top}px;width:${CC.circle}px;height:${CC.circle}px;}
.cc-note{left:${CC.text_left}px;top:${CC.note_top}px;font-weight:700;font-size:12.5px;line-height:1.3;letter-spacing:2.6px;text-transform:uppercase;color:${K.muted};white-space:nowrap;}
`;
}

function cutoutCardHtml(c, s, cover, art) {
  const A = cover.spec; const K = A.colours; const X = A.text || {};
  const own = !!(A.fonts && A.fonts.display);
  const text = (name, role) => `data-ab="${name}" data-ab-text data-font-role="${role === 'display' && own ? 'cover_display' : role}"`;
  const mono = `<svg class="abs cc-mono" data-ab="monogram" data-ab-over="card" viewBox="0 0 80 80"><circle cx="40" cy="40" r="35" fill="none" stroke="${K.paper}" stroke-width="2"/><circle cx="40" cy="40" r="30" fill="none" stroke="${K.paper}" stroke-width="0.8"/>` +
    `<g fill="none" stroke="${K.paper}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${AB_PILLAR}</g></svg>`;
  return `<div class="slide ab cc" data-kind="cover" data-cover="${cover.id}">
<div class="cc-grid"></div>
<div class="abs cc-card" data-ab="card">${art.uri ? `<img src="${art.uri}" alt="${esc(art.alt)}">` : ''}<div class="cc-noart"${art.uri ? ' hidden' : ''}><div class="cc-sheet l"></div><div class="cc-sheet r"></div>${ccFacade(K)}</div></div>
${mono}
<div class="abs cc-text"><div class="cc-lead" ${text('lead-in', 'display')}>${esc(plain(s.lead_in || ''))}</div>
<div class="cc-h" ${text('headline', 'body')}>${esc(plain(s.headline)).replace(/\n/g, '<br>')}</div>
<div class="cc-sum" ${text('summary', 'body')}>${esc(plain(s.subline || ''))}</div></div>
<div class="abs cc-prompt" ${text('prompt', 'body')}>${esc(X.prompt)}</div>
<svg class="abs cc-circle" data-ab="arrow circle" viewBox="0 0 84 84"><circle cx="42" cy="42" r="42" fill="${K.oxblood}"/><path d="M25 42 H58 M46 30 L59 42 L46 54" fill="none" stroke="${K.paper}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
<div class="abs cc-note" ${text('footer disclaimer', 'body')}>${esc(X.disclaimer)}</div>
</div>`;
}

// Runs inside the page, after the fonts have loaded: steps the headline down until it has no
// more lines than the cover allows and the summary ends above the action row.
function fitCutout(cfg) {
  const slide = document.querySelector('.slide.cc');
  if (!slide) return null;
  const out = { headline_size: null, headline_lines: null, summary_lines: null, artwork_drawn: false, problems: [] };
  const sr = slide.getBoundingClientRect();
  const h = slide.querySelector('.cc-h'); const sum = slide.querySelector('.cc-sum'); const lead = slide.querySelector('.cc-lead');
  const lines = (el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
  const limit = cfg.promptTop - cfg.textGap;
  let fits = false; let room = false;
  for (const size of cfg.headlineSizes) {
    h.style.fontSize = `${size}px`;
    out.headline_size = size;
    room = sum.getBoundingClientRect().bottom - sr.top <= limit + 0.5 && h.scrollWidth <= h.clientWidth + 1;
    fits = room && lines(h) <= cfg.maxLines;
    if (fits) break;
  }
  out.headline_lines = lines(h);
  out.summary_lines = lines(sum);
  if (!room) out.problems.push(`the headline and summary do not fit above the action row, even at ${out.headline_size}px`);
  else if (!fits) out.problems.push(`the headline takes ${out.headline_lines} lines even at ${out.headline_size}px; the cover allows ${cfg.maxLines}`);
  if (out.summary_lines > cfg.summaryMaxLines) out.problems.push(`the summary takes ${out.summary_lines} lines; the cover allows ${cfg.summaryMaxLines}`);
  if (lead.scrollWidth > cfg.textWidth + 1) out.problems.push('the lead-in does not fit on one line');
  const img = slide.querySelector('.cc-card img');
  if (img) {
    if (img.complete && img.naturalWidth > 0) out.artwork_drawn = true;
    else { img.remove(); slide.querySelector('.cc-noart').hidden = false; }
  }
  return out;
}

// Runs inside the page, after the fonts have loaded. It steps the headline down until the
// headline and deck end above the strip, steps the strip figures down together until each
// stays on one line inside the strip, draws the brush strokes, and says what it did.
function fitCover(cfg) {
  const slide = document.querySelector('.slide.ab');
  if (!slide) return null;
  const out = { headline_size: null, headline_lines: null, strip_figure_size: null, brush_strokes: 0, artwork_drawn: false, problems: [] };
  const sr = slide.getBoundingClientRect();
  const strip = slide.querySelector('[data-ab-strip]');
  const head = slide.querySelector('.ab-head');
  const h = slide.querySelector('.ab-h');

  // The largest size at which the headline has no more lines than the cover allows, no word is
  // wider than the column, and the headline and deck end above the strip.
  const limit = strip.getBoundingClientRect().top - sr.top - cfg.textGap;
  const lineCount = () => Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight));
  let fits = false; let room = false;
  for (const size of cfg.headlineSizes) {
    h.style.fontSize = `${size}px`;
    out.headline_size = size;
    room = head.getBoundingClientRect().bottom - sr.top <= limit + 0.5 && h.scrollWidth <= h.clientWidth + 1;
    fits = room && lineCount() <= cfg.maxLines;
    if (fits) break;
  }
  out.headline_lines = lineCount();
  if (!room) out.problems.push(`the headline and deck do not fit above the strip, even at ${out.headline_size}px (${out.headline_lines} lines)`);
  else if (!fits) out.problems.push(`the headline takes ${out.headline_lines} lines even at ${out.headline_size}px; the cover allows ${cfg.maxLines}`);

  const figs = [...strip.querySelectorAll('.ab-big')];
  fits = false;
  for (const size of cfg.figureSizes) {
    for (const f of figs) f.style.fontSize = `${size}px`;
    out.strip_figure_size = size;
    fits = strip.scrollWidth <= strip.clientWidth + 1 && figs.every((f) => f.scrollWidth <= f.clientWidth + 1);
    if (fits) break;
  }
  if (!fits) out.problems.push(`a strip figure does not fit on one line, even at ${out.strip_figure_size}px`);

  // One stroke for each line the highlighted words sit on.
  const hr = h.getBoundingClientRect();
  const lines = [];
  for (const span of h.querySelectorAll('.ab-hl')) {
    const r = span.getBoundingClientRect();
    const line = lines.find((l) => Math.abs(l.top - r.top) < r.height / 2);
    if (line) { line.left = Math.min(line.left, r.left); line.right = Math.max(line.right, r.right); } else lines.push({ top: r.top, left: r.left, right: r.right, height: r.height });
  }
  if (cfg.highlight === 'brush') lines.forEach((l, i) => {
    const style = `left:${(l.left - hr.left - 14).toFixed(1)}px;top:${(l.top - hr.top + l.height * 0.08).toFixed(1)}px;width:${(l.right - l.left + 28).toFixed(1)}px;height:${(l.height * 0.88).toFixed(1)}px`;
    h.insertAdjacentHTML('beforeend', `<svg class="ab-brush" data-ab-deco="brush stroke" style="${style}" preserveAspectRatio="none" viewBox="0 0 100 20"><rect x="1" y="3" width="98" height="14" fill="${cfg.brush}" opacity="${cfg.brushOpacity}" filter="url(#ab-dry-${i % 3})"/></svg>`);
  });
  out.brush_strokes = cfg.highlight === 'brush' ? lines.length : 0;
  out.highlight_lines = lines.length;

  // An image that did not decode is swapped for the seal, and said.
  const img = slide.querySelector('.ab-panel img');
  if (img) {
    if (img.complete && img.naturalWidth > 0) out.artwork_drawn = true;
    else { img.remove(); slide.querySelector('.ab-noart').hidden = false; }
  }
  return out;
}

function buildHtml(c, theme, fonts, cover, art) {
  const total = c.slides.length;
  const F = theme.fixed_text;
  const tagFor = (s) => {
    if (s.tag_style && s.tag_style !== 'plain') return s.tag_style;
    const hit = Object.entries(theme.tags || {}).find(([, g]) => g.label && g.label.toLowerCase() === plain(s.eyebrow).trim().toLowerCase());
    return s.tag_style === 'plain' || !hit ? null : hit[0];
  };
  const slides = c.slides.map((s, i) => {
    const counter = theme.layout.counter.format.replace('{n}', pad2(i + 1)).replace('{total}', pad2(total));
    const furniture = `<div class="brand-mark" data-furniture data-font-role="body">${esc(F.brand_mark)}</div>` +
      `<div class="slide-counter" data-furniture data-font-role="body">${esc(counter)}</div>`;
    if (s.type === 'closing') {
      const variant = s.variant || (theme.closing.by_category || {})[c.category] || theme.closing.default;
      s._variant = variant;
      return closingHtml(theme, fonts, variant, furniture);
    }
    const themeName = s.theme || theme.sequence[i] || theme.sequence[theme.sequence.length - 1];
    if (!theme.slide_themes[themeName]) fail(`Slide ${i + 1}: unknown slide theme "${themeName}"`);
    if (s.type === 'cover' && cover && i === 0) return cover.template === 'cutout_card' ? cutoutCardHtml(c, s, cover, art) : advisoryBriefHtml(c, s, cover, art);
    if (s.type === 'cover') {
      return `<div class="slide t-${themeName}" data-kind="cover">${furniture}
<h1 data-check data-font-role="display">${rich(s.headline)}</h1>
${s.subline ? `<p class="subline" data-check data-font-role="body">${rich(s.subline)}</p>` : ''}
<div class="swipe-cta" data-furniture data-font-role="body">${esc(F.swipe)}</div>
</div>`;
    }
    const tag = tagFor(s);
    const eyebrow = !s.eyebrow ? '' : tag
      ? `<div class="tag-${tag}" data-check data-font-role="body">${rich(s.eyebrow)}</div>`
      : `<div class="eyebrow" data-check data-font-role="body">${rich(s.eyebrow)}</div>`;
    return `<div class="slide t-${themeName}" data-kind="body">${furniture}
${eyebrow}
<h2 data-check data-font-role="display"${s.body ? '' : ' style="margin-bottom:0"'}>${rich(s.headline)}</h2>
${s.body ? `<p class="body" data-check data-font-role="body">${rich(s.body)}</p>` : ''}
${theme.layout.show_handle_footer ? `<div class="handle" data-furniture data-font-role="body">${esc(F.handle)}</div>` : ''}
</div>`;
  });
  return `<!DOCTYPE html>
<html lang="en-CA"><head><meta charset="UTF-8"><title>${esc(theme.brand_name)} | ${esc(c.title)}</title>
${fonts.link}
<style>${fonts.css}${buildCss(theme, fonts)}${cover ? (cover.template === 'cutout_card' ? cutoutCardCss(theme, fonts, cover) : advisoryBriefCss(theme, fonts, cover)) : ''}</style></head>
<body>
${slides.join('\n')}
</body></html>`;
}

// ───────────────────────────── in-page checks ────────────────────────

// Runs inside the page. Returns layout problems and every colour that is drawn.
function inPageAudit(cfg) {
  const toHex = (rgb) => {
    const m = rgb.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (p.length > 3 && p[3] === 0) return null;
    return '#' + p.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  };
  const overflow = [];
  const colours = [];
  const tol = 1;
  // The editorial cover has its own layout, so it has its own check: every part stays clear of
  // the canvas edge, no text is wider than its box, no two parts touch (the seal sits on the
  // corner of the artwork box on purpose), and the strip ends above the footer rule.
  const auditCover = (slide, num, sr) => {
    const g = cfg.cover.edge;
    const box = (el) => { const r = el.getBoundingClientRect(); return { top: r.top - sr.top, left: r.left - sr.left, right: r.right - sr.left, bottom: r.bottom - sr.top }; };
    // One rectangle for each line of text, no taller than the element's own lines.
    const lineRects = (el) => {
      const b = box(el); const list = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent.trim()) continue;
        const range = document.createRange(); range.selectNodeContents(n);
        for (const r of range.getClientRects()) {
          if (r.width > 0) list.push({ top: Math.max(r.top - sr.top, b.top), bottom: Math.min(r.bottom - sr.top, b.bottom), left: r.left - sr.left, right: r.right - sr.left });
        }
      }
      return list;
    };
    const say = (message) => overflow.push({ slide: num, message: `Slide ${num} (cover): ${message}` });
    const items = [...slide.querySelectorAll('[data-ab]')].map((el) => {
      const isText = el.hasAttribute('data-ab-text');
      const label = isText ? `"${el.dataset.ab}" (${(el.textContent || '').trim().slice(0, 40)})` : `the ${el.dataset.ab}`;
      return { el, name: el.dataset.ab, isText, label, rects: isText ? lineRects(el) : [box(el)] };
    }).filter((it) => it.rects.length && it.rects.some((r) => r.right > r.left && r.bottom > r.top));
    for (const it of items) {
      if (it.rects.some((r) => r.left < g - tol || r.top < g - tol || r.right > sr.width - g + tol || r.bottom > sr.height - g + tol)) say(`${it.label} is nearer than ${g}px to the edge of the canvas, or outside it`);
      if (it.isText && it.el.scrollWidth > it.el.clientWidth + tol) say(`${it.label} is wider than its box`);
    }
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]; const b = items[j];
        if (a.el.dataset.abOver === b.name || b.el.dataset.abOver === a.name) continue;
        const hit = a.rects.some((x) => b.rects.some((y) => x.left < y.right - tol && x.right > y.left + tol && x.top < y.bottom - tol && x.bottom > y.top + tol));
        if (hit) say(`${a.label} overlaps ${b.label}`);
      }
    }
    for (const el of slide.querySelectorAll('[data-ab-deco]')) {
      const r = box(el);
      if (r.left < -tol || r.top < -tol || r.right > sr.width + tol || r.bottom > sr.height + tol) say(`a ${el.dataset.abDeco} leaves the canvas`);
    }
    const strip = slide.querySelector('[data-ab-strip]');
    if (strip) {
      const r = box(strip);
      if (r.bottom > cfg.cover.stripBottom + tol) say(`the three-column strip ends ${Math.round(r.bottom - cfg.cover.stripBottom)}px too low: a strip detail is too long`);
      if (strip.scrollWidth > strip.clientWidth + tol) say('the three-column strip is wider than the canvas allows');
    }
  };
  document.querySelectorAll('.slide').forEach((slide, idx) => {
    const num = idx + 1;
    const sr = slide.getBoundingClientRect();
    const cs = getComputedStyle(slide);
    const box = { top: parseFloat(cs.paddingTop), left: parseFloat(cs.paddingLeft), right: sr.width - parseFloat(cs.paddingRight), bottom: sr.height - parseFloat(cs.paddingBottom) };
    const rel = (el) => { const r = el.getBoundingClientRect(); return { top: r.top - sr.top, left: r.left - sr.left, right: r.right - sr.left, bottom: r.bottom - sr.top }; };
    const name = (el) => (el.className && typeof el.className === 'string' && el.className.split(' ')[0]) || el.tagName.toLowerCase();
    const textRect = (el) => {
      const range = document.createRange(); range.selectNodeContents(el);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0);
      if (!rects.length) return rel(el);
      return { top: Math.min(...rects.map((r) => r.top)) - sr.top, left: Math.min(...rects.map((r) => r.left)) - sr.left, right: Math.max(...rects.map((r) => r.right)) - sr.left, bottom: Math.max(...rects.map((r) => r.bottom)) - sr.top };
    };
    if (slide.classList.contains('ab')) auditCover(slide, num, sr);
    const furniture = [...slide.querySelectorAll('[data-furniture]')].map((el) => ({ el, r: rel(el) }));
    const m = cfg.safe;
    for (const f of furniture) {
      if (f.r.top < m.top - tol || f.r.left < m.left - tol || f.r.right > sr.width - m.right + tol || f.r.bottom > sr.height - m.bottom + tol) {
        overflow.push({ slide: num, message: `Slide ${num}: "${name(f.el)}" sits inside the safe margin` });
      }
    }
    slide.querySelectorAll('[data-check]').forEach((el) => {
      const r = rel(el); const t = textRect(el);
      const what = `"${name(el)}" (${(el.textContent || '').trim().slice(0, 40)})`;
      if (r.top < box.top - tol || r.bottom > box.bottom + tol) {
        overflow.push({ slide: num, message: `Slide ${num}: ${what} overflows its box by ${Math.round(Math.max(box.top - r.top, r.bottom - box.bottom))}px (top or bottom)` });
      } else if (t.left < box.left - tol || t.right > box.right + tol || el.scrollWidth > el.clientWidth + tol) {
        overflow.push({ slide: num, message: `Slide ${num}: ${what} overflows its box at the side` });
      }
      for (const f of furniture) {
        if (t.left < f.r.right && t.right > f.r.left && t.top < f.r.bottom && t.bottom > f.r.top) {
          overflow.push({ slide: num, message: `Slide ${num}: ${what} overlaps "${name(f.el)}"` });
        }
      }
    });
    const seen = new Set();
    const note = (hex, where) => { if (hex && !seen.has(hex + where)) { seen.add(hex + where); colours.push({ slide: num, hex, where }); } };
    [slide, ...slide.querySelectorAll('*')].forEach((el) => {
      const s = getComputedStyle(el);
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (hasText) note(toHex(s.color), `text of ${name(el)}`);
      note(toHex(s.backgroundColor), `background of ${name(el)}`);
      for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        if (parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none') note(toHex(s[`border${side}Color`]), `border of ${name(el)}`);
      }
      (s.backgroundImage.match(/rgba?\([^)]+\)/g) || []).forEach((g) => note(toHex(g), `gradient of ${name(el)}`));
      if (el instanceof SVGGeometryElement) {
        if (s.fill !== 'none') note(toHex(s.fill), `fill of ${name(el)}`);
        if (s.stroke !== 'none') note(toHex(s.stroke), `stroke of ${name(el)}`);
      }
    });
  });
  return { overflow, colours, height: document.documentElement.scrollHeight };
}

// Which fonts Chromium really drew, per role, from the browser itself.
async function fontsUsed(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-font-role]' });
  const used = {};
  for (const nodeId of nodeIds) {
    const { attributes } = await cdp.send('DOM.getAttributes', { nodeId });
    const role = attributes[attributes.indexOf('data-font-role') + 1];
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    used[role] = used[role] || {};
    for (const f of fonts) used[role][f.familyName] = (used[role][f.familyName] || 0) + f.glyphCount;
  }
  await cdp.detach();
  return used;
}

// ───────────────────────────── output checks ─────────────────────────

function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} is not a PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), bytes: b.length };
}
const pdfBox = (file) => {
  const m = fs.readFileSync(file).toString('latin1').match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/);
  return m ? { w: +(m[3] - m[1]).toFixed(2), h: +(m[4] - m[2]).toFixed(2) } : null;
};
const pdfPages = (file) => (fs.readFileSync(file).toString('latin1').match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length;

// ───────────────────────────── main ──────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.help || !args.input) {
    console.log('Usage: node renderer/render.js <carousel.json> [--out <dir>] [--theme <theme.json>] [--client <id>] [--fonts-dir <dir>] [--no-web-fonts] [--allow-fallback-fonts]');
    process.exit(args.flags.help ? 0 : 2);
  }
  if (args.flags['fonts-dir']) FONT_DIR = path.resolve(args.flags['fonts-dir']);
  if (!fs.existsSync(args.input)) fail(`Input file not found: ${args.input}`);
  let raw;
  try { raw = JSON.parse(fs.readFileSync(args.input, 'utf8').replace(/^﻿/, '')); } catch (e) { fail(`Input is not valid JSON: ${e.message}`); }
  const client = args.flags.client || raw.client;
  if (!client && !args.flags.theme) fail('Input has no "client" and no --client or --theme was given');
  const themeFile = path.resolve(args.flags.theme || path.join(REPO_ROOT, 'clients', client, 'theme.json'));
  const theme = loadTheme(themeFile);
  const carousel = normaliseInput(raw, theme);
  const { width: W, height: H } = theme.canvas;

  const cover = pickCover(carousel, theme);
  const art = cover ? loadArt(carousel.slides[0], args.input) : null;
  const breaches = [...checkTheme(theme), ...checkContent(carousel, theme, cover)];
  const warnings = [];
  const fonts = planFonts(theme, args.flags, cover);
  const html = buildHtml(carousel, theme, fonts, cover, art);

  const outDir = path.resolve(args.flags.out || path.join(__dirname, 'out', `${slugify(carousel.title)}${carousel.date ? '-' + carousel.date : ''}`));
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) if (/^slide-\d+\.png$|\.pdf$|^render\.json$/.test(f)) fs.unlinkSync(path.join(outDir, f));

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const files = [];
  let fontReport; let pdfInfo; let coverReport = null;
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    if (fonts.source !== 'web') await page.route(/^https?:/, (r) => r.abort());
    await page.setContent(html, { waitUntil: 'load', timeout: 45000 }).catch((e) => warnings.push(`Page load: ${e.message.split('\n')[0]}`));

    // Ask for every face the scheme needs, then see which really arrived.
    const faces = await page.evaluate(async (required) => {
      const out = [];
      for (const f of required) {
        const spec = `${f.style === 'italic' ? 'italic ' : ''}${f.weight} 40px '${f.family}'`;
        let loaded = [];
        try { loaded = await Promise.race([document.fonts.load(spec), new Promise((r) => setTimeout(() => r([]), 15000))]); } catch (e) { loaded = []; }
        out.push({ ...f, loaded: loaded.length > 0 });
      }
      await document.fonts.ready;
      return out;
    }, fonts.useBrand ? fonts.required : []);
    const missing = fonts.useBrand ? faces.filter((f) => !f.loaded) : fonts.required;

    // The editorial cover is fitted once the fonts are in: headline size, strip figure size, the highlight.
    if (cover && cover.template === 'cutout_card') {
      const A = cover.spec;
      const fit = await page.evaluate(fitCutout, { headlineSizes: A.headline_sizes || [78], maxLines: A.headline_max_lines || 2, summaryMaxLines: A.summary_max_lines || 4, promptTop: CC.prompt_top, textGap: CC.text_gap, textWidth: CC.text_width });
      for (const p of fit.problems) breaches.push({ rule: 'text_overflow', slide: 1, message: `Slide 1 (${cover.id} cover): ${p}` });
      if (art.status === 'embedded' && !fit.artwork_drawn) { art.status = 'no artwork'; art.note = 'the artwork file could not be decoded as an image'; }
      coverReport = {
        layout: cover.id,
        template: cover.template,
        name: A.name || cover.id,
        used_because: cover.why,
        artwork: art.status,
        artwork_file: art.file,
        artwork_note: art.note || null,
        artwork_source: art.status === 'embedded' ? art.source : null,
        headline_size: fit.headline_size,
        headline_lines: fit.headline_lines,
        summary_lines: fit.summary_lines,
      };
      if (art.status !== 'embedded') warnings.push(`Cover: no artwork (${art.note}). The card is drawn with the stand-in facade and two blank sheets`);
    } else if (cover) {
      const A = cover.spec;
      const fit = await page.evaluate(fitCover, { headlineSizes: A.headline_sizes || [65], maxLines: A.headline_max_lines || 6, figureSizes: A.figure_sizes || [74], textGap: AB.text_gap, brush: A.colours.brass, brushOpacity: AB.brush_opacity, highlight: abStyle(A).highlight });
      for (const p of fit.problems) breaches.push({ rule: 'text_overflow', slide: 1, message: `Slide 1 (${cover.id} cover): ${p}` });
      if (art.status === 'embedded' && !fit.artwork_drawn) { art.status = 'no artwork'; art.note = 'the artwork file could not be decoded as an image'; }
      coverReport = {
        layout: cover.id,
        name: A.name || cover.id,
        used_because: cover.why,
        artwork: art.status,
        artwork_file: art.file,
        artwork_note: art.note || null,
        artwork_source: art.status === 'embedded' ? art.source : null,
        motto_drawn: !!String((A.text || {}).motto || '').trim(),
        headline_size: fit.headline_size,
        headline_lines: fit.headline_lines,
        highlight_style: abStyle(A).highlight,
        highlight_lines: fit.highlight_lines,
        highlight_strokes: fit.brush_strokes,
        strip_figure_size: fit.strip_figure_size,
      };
      if (art.status !== 'embedded') warnings.push(`Cover: no artwork (${art.note}). The artwork box is drawn with the seal`);
    }
    const used = await fontsUsed(page);
    // Chromium names a variable font by its instance ("DM Sans 9pt"), so match on the start of the name.
    const share = (role, family) => {
      const u = used[role] || {}; let all = 0; let hit = 0;
      for (const [name, glyphs] of Object.entries(u)) { all += glyphs; if (name === family || name.startsWith(family + ' ')) hit += glyphs; }
      return all ? hit / all : 0;
    };
    const coverFace = cover && cover.spec.fonts && cover.spec.fonts.display ? cover.spec.fonts.display.family : null;
    const brandOk = !missing.length && share('display', theme.fonts.display.family) >= 0.9 && share('body', theme.fonts.body.family) >= 0.9 &&
      (!coverFace || share('cover_display', coverFace) >= 0.9);
    fontReport = {
      source: brandOk ? fonts.source : 'system-fallback',
      brand_fonts_used: brandOk,
      note: fonts.note + (fonts.useBrand && !brandOk ? '. They did not load, so system fallback fonts were drawn' : ''),
      requested: { display: theme.fonts.display.family, body: theme.fonts.body.family, ...(coverFace ? { cover_display: coverFace } : {}) },
      local_files: fonts.files,
      faces_not_loaded: missing.map((f) => `${f.family} ${f.weight}${f.style === 'italic' ? ' italic' : ''}`),
      drawn_with: Object.fromEntries(Object.entries(used).map(([role, u]) => [role, Object.entries(u).sort((a, b) => b[1] - a[1]).map(([family, glyphs]) => ({ family, glyphs }))])),
    };
    if (!brandOk) {
      const msg = `Brand fonts were not used (${fontReport.note}). Drawn with: display = ${(fontReport.drawn_with.display || [{}])[0].family}, body = ${(fontReport.drawn_with.body || [{}])[0].family}`;
      if (theme.rules.require_brand_fonts && !args.flags.allowFallbackFonts) breaches.push({ rule: 'brand_fonts', slide: null, message: msg });
      else warnings.push(msg);
    }

    const audit = await page.evaluate(inPageAudit, { safe: theme.canvas.safe_margin, cover: { edge: cover ? (cover.spec.edge_gap || 0) : 0, stripBottom: AB.foot_rule - AB.strip_gap } });
    for (const o of audit.overflow) breaches.push({ rule: 'text_overflow', ...o });
    const palette = new Set(Object.values(theme.palette).map(normHex));
    // The cover's own colours are allowed on the cover slide and nowhere else.
    const coverPalette = new Set(cover ? Object.values(cover.spec.colours).map(normHex) : []);
    const forbidden = new Set((theme.forbidden_colours || []).map(normHex));
    for (const col of audit.colours) {
      if (palette.has(col.hex)) continue;
      if (col.slide === 1 && coverPalette.has(col.hex) && !forbidden.has(col.hex)) continue;
      breaches.push({ rule: forbidden.has(col.hex) ? 'colour_forbidden' : 'colour_outside_palette', slide: col.slide, message: `Slide ${col.slide}: ${col.hex} (${col.where}) is ${forbidden.has(col.hex) ? "on the theme's forbidden list" : "not in the theme's palette"}` });
    }

    const slideEls = page.locator('.slide');
    const count = await slideEls.count();
    for (let i = 0; i < count; i++) {
      const name = `slide-${pad2(i + 1)}.png`;
      const file = path.join(outDir, name);
      await slideEls.nth(i).screenshot({ path: file, animations: 'disabled' });
      const size = pngSize(file);
      files.push({ file: name, type: 'image/png', slide: i + 1, kind: carousel.slides[i].type, ...size });
      if (size.width !== W || size.height !== H) breaches.push({ rule: 'image_size', slide: i + 1, message: `${name} is ${size.width}x${size.height}; it must be ${W}x${H}` });
    }

    const pdfName = `${slugify(carousel.title)}.pdf`;
    const pdfFile = path.join(outDir, pdfName);
    // Chromium rounds odd page sizes up (1350px became a 1351px page with a white line at
    // the foot, as on the slides published in 2026). A page 8 inches wide in the slide's
    // own proportion is exact: for 1080x1350 that is 8x10 in, which is 1080x1350 at 135 dpi.
    const pdfW = 8; const pdfH = (8 * H) / W;
    await page.pdf({ path: pdfFile, width: `${pdfW}in`, height: `${pdfH}in`, scale: (pdfW * 96) / W, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    const box = pdfBox(pdfFile);
    pdfInfo = { file: pdfName, type: 'application/pdf', pages: pdfPages(pdfFile), page_size_in: `${pdfW}x${pdfH}`, page_size_pt: box ? `${box.w}x${box.h}` : null, same_shape_as_slides: !!box && Math.abs(box.w / box.h - W / H) < 0.0005, bytes: fs.statSync(pdfFile).size };
    if (pdfInfo.pages !== count) breaches.push({ rule: 'pdf_pages', slide: null, message: `The PDF has ${pdfInfo.pages} pages for ${count} slides` });
    if (!pdfInfo.same_shape_as_slides) breaches.push({ rule: 'pdf_page_size', slide: null, message: `The PDF page (${pdfInfo.page_size_pt} pt) is not the same shape as the ${W}x${H} slides` });
  } finally {
    await browser.close();
  }

  const report = {
    ok: breaches.length === 0,
    renderer_version: VERSION,
    rendered_at: new Date().toISOString(),
    client: theme.client,
    title: carousel.title,
    category: carousel.category || null,
    date: carousel.date || null,
    input: path.relative(REPO_ROOT, path.resolve(args.input)),
    theme: path.relative(REPO_ROOT, themeFile),
    cover: coverReport,
    closing_variant: (carousel.slides.find((s) => s.type === 'closing') || {})._variant || null,
    fonts: fontReport,
    images: files,
    pdf: pdfInfo,
    use_for: { instagram: 'images', facebook: 'images', linkedin: 'pdf' },
    breaches,
    warnings,
  };
  fs.writeFileSync(path.join(outDir, 'render.json'), JSON.stringify(report, null, 2) + '\n');

  console.log(`Rendered "${carousel.title}" for ${theme.client}`);
  console.log(`  Output:  ${outDir}`);
  console.log(`  Images:  ${files.length} PNG, ${W}x${H}`);
  console.log(`  PDF:     ${pdfInfo.file}, ${pdfInfo.pages} pages, ${pdfInfo.page_size_in} in`);
  console.log(`  Fonts:   ${fontReport.brand_fonts_used ? 'brand fonts' : 'FALLBACK FONTS'} (${fontReport.source}). Display: ${(fontReport.drawn_with.display || [{}])[0].family}. Body: ${(fontReport.drawn_with.body || [{}])[0].family}${(fontReport.drawn_with.cover_display || []).length ? `. Cover: ${fontReport.drawn_with.cover_display[0].family}` : ''}`);
  if (coverReport) console.log(`  Cover:   ${coverReport.name} (${coverReport.used_because}). Artwork: ${coverReport.artwork}. Headline ${coverReport.headline_size}px on ${coverReport.headline_lines} lines${coverReport.strip_figure_size ? `. Strip figures ${coverReport.strip_figure_size}px` : ''}${coverReport.summary_lines ? `. Summary on ${coverReport.summary_lines} lines` : ''}`);
  for (const w of warnings) console.log(`  Warning: ${w}`);
  if (breaches.length) {
    console.log(`  FAILED: ${breaches.length} rule breach(es). Do not publish.`);
    for (const b of breaches) console.log(`    - [${b.rule}] ${b.message}`);
    process.exit(1);
  }
  console.log('  Check:   passed');
}

main().catch((e) => { console.error(`render: ${e.stack || e.message}`); process.exit(2); });

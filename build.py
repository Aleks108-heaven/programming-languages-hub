"""Build index.html: one app, the Study hub modules page (Role modules is one of its sections), in four languages.

Usage:
    python build.py                 # writes index.html
    python build.py --publish OUT   # also writes a body-only copy for publishing as an Artifact

Sources:
    hub/template.html, hub/hub.js       Study hub styles, markup and logic
    hub/sections.json                   Study hub section order and attributes
    hub/content/<lang>.json             Study hub text: ui strings, hero, sections (HTML) and data
    role-modules/template.html          Role modules styles, code examples and logic (mounted in the hub's "roles" section)
    role-modules/content/<lang>.json    Role Modules text

Translations are checked against English before anything is written:
  * the same keys, list lengths, section ids and HTML structure (element ids and tag counts)
  * the same {placeholders} in every ui string
  * numbers (such as the index of the correct answer), URLs, level keys and language names unchanged
Hub translations may leave out "code" keys; code is shared from en.json.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent
LANGS = ["en", "uk", "pl", "es"]
LANG_LABELS = {"en": ("EN", "English"), "uk": ("UA", "Українська"), "pl": ("PL", "Polski"), "es": ("ES", "Español")}
FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E"
           "%3Crect width='32' height='32' rx='7' fill='%230e6b5c'/%3E"
           "%3Ctext x='16' y='22' font-family='monospace' font-size='16' font-weight='700' "
           "text-anchor='middle' fill='%23dcefe9'%3E%3C/%3E%3C/text%3E%3C/svg%3E")
HEAD = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
        f'<link rel="icon" href="{FAVICON}">\n')

# Strings that must stay identical to English (they are keys, links or code)
LOCKED = [re.compile(p) for p in (
    r"^data\.languages\.\d+\.0$",        # language names are used by the goal filter
    r"^data\.goals\.\d+\.1\.\d+$",
    r"^data\.path\.\d+\.lv$",           # level keys used for colours
    r"^data\.projects\.\d+\.0$",
    r"^data\.(snippets|sqlExamples)\.\d+\.code(\.|$)",   # source code is never translated
)]
# Keys a translation may leave out (shared from English): source code only
OMITTABLE = re.compile(r"^data\.(snippets|sqlExamples)\.\d+\.code$")


# ---------------------------------------------------------------- checks
def placeholders(text):
    return set(re.findall(r"\{\w+\}", text))


def skeleton(html):
    """Element ids and tag counts: translations may reword text, not restructure the page."""
    return set(re.findall(r'\sid="([^"]+)"', html)), Counter(re.findall(r"<([a-z][a-z0-9]*)\b", html))


def merge(en, tr, path, errors):
    """Return the translation with shared values filled in from English, recording any mismatch."""
    if tr is None:
        return en
    if isinstance(en, dict):
        if not isinstance(tr, dict):
            errors.append(f"{path}: expected an object")
            return en
        for k in set(tr) - set(en):
            errors.append(f"{path}.{k}: unexpected key")
        out = {}
        for k, v in en.items():
            if k in tr:
                out[k] = merge(v, tr[k], f"{path}.{k}", errors)
            elif OMITTABLE.match(f"{path}.{k}".split(".", 1)[1]):
                out[k] = v
            else:
                errors.append(f"{path}.{k}: missing")
                out[k] = v
        return out
    if isinstance(en, list):
        if not isinstance(tr, list) or len(tr) != len(en):
            errors.append(f"{path}: {len(tr) if isinstance(tr, list) else 'not a list'} items, expected {len(en)}")
            return en
        return [merge(a, b, f"{path}.{i}", errors) for i, (a, b) in enumerate(zip(en, tr))]
    if isinstance(en, str):
        if not isinstance(tr, str) or not tr.strip():
            errors.append(f"{path}: empty or not text")
            return en
        rel = path.split(".", 1)[1]
        if (en.startswith("http") or any(p.search(rel) for p in LOCKED)) and tr != en:
            errors.append(f"{path}: must stay {en!r}")
            return en
        return tr
    if tr != en:  # numbers and booleans are shared
        errors.append(f"{path}: must stay {en!r}")
    return en


def check_hub(en, tr, lang):
    errors = []
    merged = merge(en, tr, lang, errors)
    for key, text in en["ui"].items():
        if placeholders(text) != placeholders(tr.get("ui", {}).get(key, "")):
            errors.append(f"{lang}.ui.{key}: placeholders must be {sorted(placeholders(text))}")
    for name, a, b in [("hero", en["hero"], tr.get("hero", ""))] + [
            (f"sections.{k}", v, tr.get("sections", {}).get(k, "")) for k, v in en["sections"].items()]:
        (ida, taga), (idb, tagb) = skeleton(a), skeleton(b)
        if ida != idb:
            errors.append(f"{lang}.{name}: element ids differ {sorted(ida ^ idb)}")
        if taga != tagb:
            diff = {t: (taga[t], tagb[t]) for t in taga.keys() | tagb.keys() if taga[t] != tagb[t]}
            errors.append(f"{lang}.{name}: tag counts differ (en, {lang}) {diff}")
    return merged, errors


def check_roles(ref, other, lang):
    errors = []
    err = errors.append
    if set(ref["ui"]) != set(other["ui"]):
        err(f"{lang}: role ui keys differ: {sorted(set(ref['ui']) ^ set(other['ui']))}")
    for key, text in ref["ui"].items():
        if placeholders(text) != placeholders(other["ui"].get(key, "")):
            err(f"{lang}: role ui.{key} placeholders differ")
    if [r["id"] for r in ref["roles"]] != [r["id"] for r in other["roles"]]:
        return errors + [f"{lang}: role ids differ"]
    for a, b in zip(ref["roles"], other["roles"]):
        for field in ("expect", "tasks", "lessons", "langContext", "quiz", "exam"):
            if len(a[field]) != len(b[field]):
                err(f"{lang}: {a['id']}.{field}: {len(b[field])} items, expected {len(a[field])}")
        for i, (la, lb) in enumerate(zip(a["lessons"], b["lessons"])):
            if la["code"] != lb["code"] or len(la["langs"]) != len(lb["langs"]):
                err(f"{lang}: {a['id']}.lessons[{i}] code id or language-note count differs")
        for field in ("quiz", "exam"):
            for i, (qa, qb) in enumerate(zip(a[field], b[field])):
                if qa["c"] != qb["c"] or len(qa["a"]) != len(qb["a"]):
                    err(f"{lang}: {a['id']}.{field}[{i}] correct answer or option count differs")
    return errors


# ---------------------------------------------------------------- pieces
def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def js_blob(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def hub_parts(errors):
    content = {l: load(ROOT / "hub" / "content" / f"{l}.json") for l in LANGS}
    merged = {"en": content["en"]}
    for l in LANGS[1:]:
        merged[l], errs = check_hub(content["en"], content[l], l)
        errors += errs
    tpl = (ROOT / "hub" / "template.html").read_text(encoding="utf-8")
    head, markup = tpl.split("</style>", 1)
    data = "<script>\nwindow.I18N_HUB=" + js_blob(merged) + ";\nwindow.HUB_ORDER=" + js_blob(load(ROOT / "hub" / "sections.json")) + ";\n</script>"
    script = "<script>\n" + (ROOT / "hub" / "hub.js").read_text(encoding="utf-8") + "</script>"
    return head, markup, data, script, merged


def role_parts(errors):
    content = {l: load(ROOT / "role-modules" / "content" / f"{l}.json") for l in LANGS}
    tpl = (ROOT / "role-modules" / "template.html").read_text(encoding="utf-8")
    for l in LANGS[1:]:
        errors += check_roles(content["en"], content[l], l)
    code_ids = set(re.findall(r'id="code-([\w-]+)"', tpl))
    errors += [f"missing code block: {x['code']}" for r in content["en"]["roles"] for x in r["lessons"] if x["code"] not in code_ids]
    tpl = tpl.replace("/*__DATA__*/null", js_blob(content))
    s = tpl.index('<style id="rm-app">')
    style = tpl[s + len('<style id="rm-app">'):tpl.index("</style>", s)]
    markup = tpl[tpl.index('<script type="text/plain"'):tpl.index("<script>\n(() => {")]
    script = tpl[tpl.index("<script>\n(() => {"):tpl.rindex("</script>") + len("</script>")]
    return style, markup, script


SHELL_CSS = """
/* ---- app bar ---- */
.appbar{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;margin-inline:-16px;padding:8px 16px;background:var(--paper);border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px}
.appbar .brand{font:650 17px var(--display);color:var(--ink);text-decoration:none;margin-right:auto}
.appbar .langs{display:flex;flex-wrap:wrap;gap:4px;padding:3px;border:1px solid var(--control);border-radius:999px;background:var(--surface)}
.appbar .langs button{font:500 13px var(--mono);letter-spacing:.03em;color:var(--ink);background:none;border:0;border-radius:999px;padding:5px 12px;min-height:34px;text-decoration:none;cursor:pointer}
.appbar .langs [aria-pressed="true"]{background:var(--brand-tint);color:var(--brand)}
.appbar .theme{font:500 12px var(--mono);color:var(--muted);background:none;border:1px solid var(--control);border-radius:999px;padding:6px 12px;min-height:40px;cursor:pointer}
@media (pointer:coarse){.appbar .langs button{min-height:44px;min-width:44px}.appbar .theme{min-height:44px}}
nav.toc{top:calc(env(safe-area-inset-top,0px) + 72px);max-height:calc(100vh - 88px)}
@media (max-width:640px){.appbar .brand{flex-basis:100%}}
@media print{.appbar{display:none!important}}
"""


def shell_markup():
    langs = "".join(f'<button type="button" data-l="{l}" lang="{l}" title="{name}" aria-label="{name}">{short}</button>'
                    for l, (short, name) in LANG_LABELS.items())
    return ('<a class="skip" href="#main" id="ab-skip"></a>\n'
            '<div class="readbar" id="readbar" aria-hidden="true"></div>\n'
            '<header class="appbar"><a class="brand" href="#hub-hero" id="ab-brand"></a>'
            f'<div class="langs" role="group" id="ab-langs">{langs}</div>'
            '<button type="button" class="theme" id="themeBtn"></button></header>\n'
            '<button type="button" class="toTop" id="toTop">↑</button>\n')


SHELL_JS = """<script>
/* ---- app shell: language and theme for the whole page ---- */
(() => {
  const LANGS = ['en', 'uk', 'pl', 'es'], THEMES = ['auto', 'light', 'dark'];
  const read = k => { try { return JSON.parse(localStorage.getItem(k)) } catch (e) { return null } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) {} };
  let lang = read('app-lang') ?? read('roles-lang');
  if (!LANGS.includes(lang)) { const nav = (navigator.language || 'en').slice(0, 2); lang = LANGS.includes(nav) ? nav : 'en' }
  let theme = 'auto';
  try { theme = localStorage.getItem('plhub-theme') || 'auto' } catch (e) {}
  if (!THEMES.includes(theme)) theme = 'auto';
  window.APP = {lang};
  const root = document.documentElement, $ = id => document.getElementById(id);
  const hostTheme = root.getAttribute('data-theme');
  const t = (k, v = {}) => window.I18N_HUB[lang].ui[k].replace(/\\{(\\w+)\\}/g, (_, x) => v[x]);

  function applyTheme() {
    if (theme === 'auto') { hostTheme ? root.setAttribute('data-theme', hostTheme) : root.removeAttribute('data-theme') }
    else root.setAttribute('data-theme', theme);
    $('themeBtn').textContent = t('theme', {t: t('theme' + theme[0].toUpperCase() + theme.slice(1))});
  }
  function applyLang() {
    root.lang = lang;
    $('ab-brand').textContent = t('appName');
    $('ab-langs').setAttribute('aria-label', t('language'));
    $('ab-langs').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.l === lang)));
    $('toTop').setAttribute('aria-label', t('backToTop'));
    $('ab-skip').textContent = t('skipLink');
    applyTheme();
  }
  $('ab-langs').addEventListener('click', e => {
    const b = e.target.closest('button[data-l]');
    if (!b || b.dataset.l === lang) return;
    lang = window.APP.lang = b.dataset.l; write('app-lang', lang); applyLang();
    document.dispatchEvent(new CustomEvent('app:lang', {detail: lang}));
  });
  $('themeBtn').addEventListener('click', () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    try { localStorage.setItem('plhub-theme', theme) } catch (e) {}
    applyTheme();
  });
  let closed = [];
  addEventListener('beforeprint', () => { root.setAttribute('data-theme', 'light'); closed = [...document.querySelectorAll('details:not([open])')]; closed.forEach(d => d.open = true) });
  addEventListener('afterprint', () => { applyTheme(); closed.forEach(d => d.open = false) });

  const toTop = $('toTop'), readbar = $('readbar');
  toTop.addEventListener('click', () => scrollTo({top: 0, behavior: 'smooth'}));
  addEventListener('scroll', () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    toTop.classList.toggle('show', y > 600);
    readbar.style.width = (max > 0 ? Math.min(y / max, 1) * 100 : 0) + '%';
  }, {passive: true});

  /* Scrollable tables must be reachable by keyboard: focusable only while they actually overflow */
  window.markScrollable = () => document.querySelectorAll('.tw').forEach(e => {
    if (e.scrollWidth > e.clientWidth + 1) e.tabIndex = 0; else e.removeAttribute('tabindex');
  });
  addEventListener('resize', window.markScrollable);
  document.addEventListener('app:lang', () => setTimeout(window.markScrollable));
  addEventListener('load', window.markScrollable);

  applyLang();
})();
</script>"""


def main():
    errors = []
    hub_head, hub_markup, hub_data, hub_script, merged = hub_parts(errors)
    rm_style, rm_markup, rm_script = role_parts(errors)
    if errors:
        shown = errors[:60]
        sys.exit("Build failed:\n  " + "\n  ".join(shown) + (f"\n  ... and {len(errors) - 60} more" if len(errors) > 60 else ""))

    page = (hub_head + "\n/* ---- Role modules (section of the hub) ---- */\n" + rm_style + SHELL_CSS + "</style>\n"
            + shell_markup()
            + hub_markup + "\n" + rm_markup + "\n"
            + hub_data + "\n" + SHELL_JS + "\n" + hub_script + "\n" + rm_script + "\n")
    out = ROOT / "index.html"
    out.write_text(HEAD + page + "</html>\n", encoding="utf-8")
    print(f"wrote {out.name} ({len(page):,} bytes; languages: {', '.join(LANGS)})")
    if "--publish" in sys.argv:
        pub = Path(sys.argv[sys.argv.index("--publish") + 1])
        pub.write_text(page, encoding="utf-8")
        print(f"wrote {pub}")


if __name__ == "__main__":
    main()

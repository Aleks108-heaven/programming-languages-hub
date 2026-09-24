"""Build index.html: the Programming Languages Hub and Role Modules in one page.

Usage:
    python build.py                 # writes index.html
    python build.py --publish OUT   # also writes a body-only copy for publishing as an Artifact

Sources:
    Programming-Languages-Hub.html     the study hub (edit its DATA block and HTML)
    role-modules/template.html         Role Modules layout, styles, code examples and logic
    role-modules/content/<lang>.json   Role Modules text in en, uk, pl and es

Every translation must mirror en.json exactly: same UI keys and placeholders, same roles,
lessons and code ids, and the same number of options and correct answer for every question.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
ROLES = ROOT / "role-modules"
LANGS = ["en", "uk", "pl", "es"]
HEAD = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n')


def check(ref, other, lang):
    errors = []
    err = lambda msg: errors.append(f"{lang}: {msg}")
    if set(ref["ui"]) != set(other["ui"]):
        err(f"ui keys differ: {sorted(set(ref['ui']) ^ set(other['ui']))}")
    for key, text in ref["ui"].items():
        want = set(re.findall(r"\{\w+\}", text))
        got = set(re.findall(r"\{\w+\}", other["ui"].get(key, "")))
        if want != got:
            err(f"ui.{key} placeholders {got} != {want}")
    if [r["id"] for r in ref["roles"]] != [r["id"] for r in other["roles"]]:
        err("role ids differ")
        return errors
    for a, b in zip(ref["roles"], other["roles"]):
        rid = a["id"]
        for field in ("expect", "tasks", "lessons", "langContext", "quiz", "exam"):
            if len(a[field]) != len(b[field]):
                err(f"{rid}.{field}: {len(b[field])} items, expected {len(a[field])}")
        for i, (la, lb) in enumerate(zip(a["lessons"], b["lessons"])):
            if la["code"] != lb["code"] or len(la["langs"]) != len(lb["langs"]):
                err(f"{rid}.lessons[{i}] code id or language-note count differs")
        for field in ("quiz", "exam"):
            for i, (qa, qb) in enumerate(zip(a[field], b[field])):
                if qa["c"] != qb["c"] or len(qa["a"]) != len(qb["a"]):
                    err(f"{rid}.{field}[{i}] correct answer or option count differs")
    return errors


def between(text, start, end, what):
    i = text.find(start)
    j = text.find(end, i + len(start))
    if i < 0 or j < 0:
        sys.exit(f"Build failed: cannot find {what}")
    return text[i + len(start):j]


def role_modules():
    data = {l: json.loads((ROLES / "content" / f"{l}.json").read_text(encoding="utf-8")) for l in LANGS}
    tpl = (ROLES / "template.html").read_text(encoding="utf-8")
    errors = [e for l in LANGS[1:] for e in check(data["en"], data[l], l)]
    code_ids = set(re.findall(r'id="code-([\w-]+)"', tpl))
    errors += [f"missing code block: {x['code']}" for r in data["en"]["roles"] for x in r["lessons"] if x["code"] not in code_ids]
    if errors:
        sys.exit("Build failed:\n  " + "\n  ".join(errors))
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    tpl = tpl.replace("/*__DATA__*/null", blob)
    style = between(tpl, '<style id="rm-app">', "</style>", "Role Modules styles")
    start = tpl.index('<div class="rm-root')
    markup = tpl[start:tpl.index("<script>\n(() => {")]      # app markup + code example blocks
    markup = markup.replace('href="__HUB_URL__" target="_blank" rel="noopener"', 'href="#hub"')
    script = tpl[tpl.index("<script>\n(() => {"):tpl.rindex("</script>") + len("</script>")]
    return style, markup, script


SHELL_CSS = """
.viewbar{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding-block:10px;background:var(--paper);border-bottom:1px solid var(--line)}
.viewbar a{font:500 13px var(--mono);letter-spacing:.04em;text-decoration:none;color:var(--ink);border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:6px 14px}
.viewbar a[aria-current="page"]{background:var(--brand-tint);border-color:var(--brand);color:var(--brand)}
nav.toc{top:calc(env(safe-area-inset-top,0px) + 64px);max-height:calc(100vh - 80px)}
@media print{.viewbar,#view-roles{display:none!important}}
"""

SHELL_JS = """<script>
/* ---- one app, two views: #hub (default) and #roles / #intern / #junior / #mid ---- */
(() => {
  const ROLE_HASHES = ['roles', 'intern', 'junior', 'mid'];
  const hub = document.getElementById('view-hub'), roles = document.getElementById('view-roles');
  function show() {
    const h = location.hash.slice(1), inRoles = ROLE_HASHES.includes(h);
    hub.hidden = inRoles; roles.hidden = !inRoles;
    document.getElementById('vb-hub').setAttribute('aria-current', inRoles ? 'false' : 'page');
    document.getElementById('vb-roles').setAttribute('aria-current', inRoles ? 'page' : 'false');
    let lang = 'en';
    if (inRoles) { try { lang = JSON.parse(localStorage.getItem('roles-lang')) || 'en' } catch (e) {} }
    document.documentElement.lang = ['en', 'uk', 'pl', 'es'].includes(lang) ? lang : 'en';
    if (h === 'hub' || h === 'roles') scrollTo(0, 0);
  }
  addEventListener('hashchange', show);
  show();
})();
</script>"""


def main():
    hub = (ROOT / "Programming-Languages-Hub.html").read_text(encoding="utf-8")
    if not hub.startswith(HEAD):
        sys.exit("Build failed: unexpected start of Programming-Languages-Hub.html")
    hub = hub[len(HEAD):].rstrip()
    hub = hub[:-len("</html>")] if hub.endswith("</html>") else hub
    head, rest = hub.split("</style>", 1)
    body, hub_script = rest[:rest.index("<script>")], rest[rest.index("<script>"):]
    rm_style, rm_markup, rm_script = role_modules()

    page = (head + "\n/* ---- Role Modules ---- */\n" + rm_style + SHELL_CSS + "</style>\n"
            '<nav class="viewbar" aria-label="Views"><a href="#hub" id="vb-hub">Study hub</a>'
            '<a href="#roles" id="vb-roles">Role modules · EN · UK · PL · ES</a></nav>\n'
            '<div id="view-hub">' + body + "</div>\n"
            '<div id="view-roles" hidden>\n' + rm_markup + "</div>\n"
            + hub_script + "\n" + rm_script + "\n" + SHELL_JS + "\n")
    out = ROOT / "index.html"
    out.write_text(HEAD + page + "</html>\n", encoding="utf-8")
    print(f"wrote {out.name} ({len(page):,} bytes; Role Modules languages: {', '.join(LANGS)})")
    if "--publish" in sys.argv:
        pub = Path(sys.argv[sys.argv.index("--publish") + 1])
        pub.write_text(page, encoding="utf-8")
        print(f"wrote {pub}")


if __name__ == "__main__":
    main()

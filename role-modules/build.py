"""Build Role-Modules.html from template.html and content/<lang>.json.

Usage:
    python build.py                 # writes ../Role-Modules.html
    python build.py --publish OUT   # also writes a body-only copy for publishing

Every translation must mirror en.json exactly: same UI keys, same roles,
lessons, code ids, and the same number of options and the same correct
answer index for every quiz and exam question.
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
LANGS = ["en", "uk", "pl", "es"]
HUB_URL = "https://claude.ai/artifact/4MAQg6U7GzJAtDMjrtQH5C"


def check(ref, other, lang):
    errors = []

    def err(msg):
        errors.append(f"{lang}: {msg}")

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


def main():
    data = {l: json.loads((HERE / "content" / f"{l}.json").read_text(encoding="utf-8")) for l in LANGS}
    errors = [e for l in LANGS[1:] for e in check(data["en"], data[l], l)]
    template = (HERE / "template.html").read_text(encoding="utf-8")
    code_ids = set(re.findall(r'id="code-([\w-]+)"', template))
    for role in data["en"]["roles"]:
        for lesson in role["lessons"]:
            if lesson["code"] not in code_ids:
                errors.append(f"missing code block: {lesson['code']}")
    if errors:
        sys.exit("Build failed:\n  " + "\n  ".join(errors))

    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    body = template.replace("/*__DATA__*/null", blob).replace("__HUB_URL__", HUB_URL)
    full = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">\n' + body + "\n</html>\n")
    out = HERE.parent / "Role-Modules.html"
    out.write_text(full, encoding="utf-8")
    print(f"wrote {out.name} ({len(full):,} bytes, languages: {', '.join(LANGS)})")
    if "--publish" in sys.argv:
        pub = Path(sys.argv[sys.argv.index("--publish") + 1])
        pub.write_text(body, encoding="utf-8")
        print(f"wrote {pub}")


if __name__ == "__main__":
    main()

# Programming Languages Hub

A study hub that takes a learner from **internship** to **junior** to **mid-level** developer. It covers how programming languages work, the 2026 language landscape, SQL and databases, a structured learning path, and a quiz after every part. A second view, **Role Modules**, goes deeper into each career level. Both live in one page, `index.html`, and **the whole app is available in English, Ukrainian, Polish and Spanish**.

Everything runs in the browser as plain HTML, CSS and JavaScript. There is no framework, no server and nothing to install.

## Run it

**Online:** https://claude.ai/artifact/4MAQg6U7GzJAtDMjrtQH5C (private until the owner shares it).

**Locally**, you need Python 3.9 or newer:

```sh
python serve.py
```

This rebuilds `index.html`, starts a server at http://127.0.0.1:8000/ and opens it in your browser. Press Ctrl+C to stop it.

| Option | Effect |
|---|---|
| `--port 9000` | Use another port |
| `--no-build` | Serve the existing `index.html` without rebuilding |
| `--no-open` | Don't open a browser tab |

The server listens on `127.0.0.1` only, so other machines can't reach it, and it serves nothing but the app page (every other path returns 404). You can also open `index.html` directly from disk with no server.

**The app bar** stays at the top of the page and controls everything:

| Control | What it does |
|---|---|
| **Study hub / Role modules** | Switches the view. Links can open a view directly: `#roles`, `#intern`, `#junior`, `#mid`, or any hub section such as `#sql`. |
| **EN · UA · PL · ES** | Switches the language of the whole app: every section, table, checklist, quiz, exam and role module. Your ticks, scores and review list are kept. |
| **Theme** | Cycles auto, light and dark. |

On first visit the language follows the browser's language if it's one of the four, otherwise English. The choice is remembered.

## What's inside

```
index.html                                      the app: hub + Role Modules (generated, do not edit by hand)
build.py                                        validates the translations and builds index.html (with the app bar)
serve.py                                        builds, then serves the app on 127.0.0.1
hub/
  content/en.json, uk.json, pl.json, es.json    all Study hub text: interface strings, sections (HTML) and data
  sections.json                                 section order
  template.html, hub.js                         Study hub styles, markup and logic
role-modules/
  content/en.json, uk.json, pl.json, es.json    all Role Modules text, one file per language
  template.html                                 Role Modules layout, styles, code examples and logic
Programming-Languages-Learning-Map-Expanded.md  the full guide as a Markdown document
design-system/                                  colour tokens, type and page patterns (PL Hub)
```

### Study hub view

About 31 sections in six parts, each part followed by a quiz:

1. **Foundations**: what a language is; language vs. runtime, library and framework; how code gets executed (AOT, bytecode + VM, interpreters and JIT, transpilation).
2. **Concepts that transfer**: core concepts, type systems, memory models, and **Same task, six languages**, which shows 4 everyday tasks in Python, TypeScript, Java, C#, Go and Rust.
3. **SQL & database programming**: SQL as a declarative domain-specific language, core skills, tickable internship/junior/mid progression, runnable examples (joins, CTEs, transactions, indexes and plans, parameterised queries) and a dialect comparison (PostgreSQL, MySQL, SQL Server, Oracle, SQLite).
4. **The 2026 landscape**: popularity trackers and salary signals.
5. **AI-assisted development**: how to work with coding assistants responsibly.
6. **Career stages**: internship, junior and mid-level checklists; how deep to go at each stage; choosing a language; the QA perspective (including why ISTQB certifications are tool- and language-agnostic); a **five-phase structured learning path** with goals, builds and "done when" criteria; the learning sequence; project progression; common mistakes.

A **Quick reference** section closes the hub with four cheat sheets: Big-O complexity at a glance, everyday Git commands, HTTP status codes and common regex patterns.

Study tools:

- A **quiz after each part** (6 quizzes), a **self-check**, and a scored **final exam** (17 questions, pass mark 70%).
- **Review my mistakes** collects every missed question until you answer it correctly.
- **Progress summary** in the header, **search** across all sections, a **theme** toggle (auto, light, dark), and a print layout (Ctrl+P when opened locally).
- The hero has quick links straight to the fundamentals, the final exam and Role Modules. A **reading-progress bar** and a **back-to-top** button appear as you scroll, and the section list collapses into a tap-to-open menu on narrow screens.
- A **Practice** list of free sites checked in September 2026: freeCodeCamp, The Odin Project, Codewars, Advent of Code, Go by Example, Rust by Example, Learn Git Branching, SQLBolt, PostgreSQL Exercises, Use The Index Luke, roadmap.sh, Exercism, LeetCode, SQL Murder Mystery and Frontend Mentor.
- A **Docs** list of official references and guides, including the Pro Git book, Refactoring Guru's design patterns, The System Design Primer, Real Python and The Twelve-Factor App, alongside the per-language official docs.

### Role Modules view

Three role tracks: **Internship**, **Junior** and **Mid-level**. Each track has:

- an overview, what employers expect, and typical first tasks
- 5–6 lessons, each with notes for Python, TypeScript/JavaScript, Java, C#, Go, Rust and SQL where relevant, plus a code example
- a table of which languages matter at that level
- a **module quiz** (6 questions, instant feedback) and a **role exam** (12 questions, pass mark 70%)

Code and code comments stay in English in every language, as in real codebases.

## Editing content

All text lives in JSON, one file per language:

- **Study hub:** `hub/content/<lang>.json` has `ui` (buttons and labels), `hero`, `sections` (each section's HTML) and `data` (tables, checklists, the learning path, quizzes, the exam, code notes and links).
- **Role Modules:** `role-modules/content/<lang>.json`.

`en.json` is the reference. Source code and URLs exist only there; the other languages leave out `code` keys and use `null` for URLs and numbers, and the build fills them in from English. A hub quiz or exam row looks like this:

```json
["Question?", ["Answer A", "Answer B", "Answer C", "Answer D"], 2, "Explanation shown after answering."]
```

The number is the index of the correct answer, counting from 0. It must be the same in every language. The number of questions and the pass mark update automatically.

To add content, add it to `en.json` first, then to the same place in the other three files.

After any change, rebuild (or just run `python serve.py`, which rebuilds first):

```sh
python build.py
```

The build refuses to write `index.html` if any translation differs from English in structure, and lists every problem:

- a missing or extra key, section, question, option or list item
- a different correct answer, number or URL
- a changed language name, level key or code-example id
- a missing `{placeholder}` in an interface string
- different HTML structure in a section (element ids or tag counts)

This keeps all four languages showing the same page and marking the same answers as correct.

## Where progress is stored

Checklist ticks, quiz and exam scores, the review list and the chosen theme and language are saved in the viewer's own browser (`localStorage`). Nothing is sent anywhere, and each person and device starts with a blank slate. The **Clear my progress** / **Clear my scores** buttons reset it.

## Verification and security

- The page scripts were exercised in a headless browser (jsdom) in all four languages: every section renders (including the new Quick reference cheat sheets), switching language keeps progress and section structure, quizzes score correctly, and there are no script errors.
- Code examples: the Python, TypeScript, Java (21) and C# (.NET 10) snippets in the hub were run and produce the expected output. The SQL examples were run against SQLite. The Go and Rust snippets, and the code examples in Role Modules, were reviewed but not compiled.
- All external links returned HTTP 200 in September 2026, including the newly added ones, except exercism.org and leetcode.com, which return an automated-request block (HTTP 403) to a plain `curl` request but are live, well-known services when opened in a browser.
- Security review: no secrets in the repository; no `eval` or other dynamic code; all external links use `rel="noopener"`; the only external resource loaded is Google Fonts. All displayed content comes from the pages' own data. Values read back from `localStorage` are validated (whole numbers only) before they reach the page, so tampered storage cannot inject HTML. The September 2026 UI/UX update (Quick reference tables, hero CTAs, back-to-top button, reading-progress bar, collapsible TOC, favicon) was diff-reviewed for new attack surface: no new `localStorage` reads, URL/hash parsing, `eval`, or external resources were introduced, and the new data tables render through the same build-time, translator-authored (non-user-input) content path already used by every other table on the page. No findings.
- The local server binds to 127.0.0.1, serves only `/` and `/index.html` (source files, folders and `.git` return 404), and sends `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- Translations were written with AI assistance; a native-speaker review is recommended before wide sharing.
- The Aikido security scan was not run, because it requires signing in to Aikido.

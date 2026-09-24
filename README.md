# Programming Languages Hub

A study hub that takes a learner from **internship** to **junior** to **mid-level** developer. It covers how programming languages work, the 2026 language landscape, SQL and databases, a structured learning path, and a quiz after every part. A second view, **Role Modules**, goes deeper into each career level in four languages. Both live in one page: `index.html`.

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

**Views:** a bar at the top switches between **Study hub** and **Role modules**. Links can open a view directly: `#roles`, `#intern`, `#junior`, `#mid`, or any hub section such as `#sql`.

## What's inside

```
index.html                                      the app: hub + Role Modules (generated, do not edit by hand)
build.py                                        validates the translations and builds index.html
serve.py                                        builds, then serves the app on 127.0.0.1
Programming-Languages-Hub.html                  source for the Study hub view
role-modules/
  content/en.json, uk.json, pl.json, es.json    all Role Modules text, one file per language
  template.html                                 Role Modules layout, styles, code examples and logic
Programming-Languages-Learning-Map-Expanded.md  the full guide as a Markdown document
design-system/                                  colour tokens, type and page patterns (PL Hub)
```

### Study hub view

About 30 sections in six parts, each part followed by a quiz:

1. **Foundations**: what a language is; language vs. runtime, library and framework; how code gets executed (AOT, bytecode + VM, interpreters and JIT, transpilation).
2. **Concepts that transfer**: core concepts, type systems, memory models, and **Same task, six languages**, which shows 4 everyday tasks in Python, TypeScript, Java, C#, Go and Rust.
3. **SQL & database programming**: SQL as a declarative domain-specific language, core skills, tickable internship/junior/mid progression, runnable examples (joins, CTEs, transactions, indexes and plans, parameterised queries) and a dialect comparison (PostgreSQL, MySQL, SQL Server, Oracle, SQLite).
4. **The 2026 landscape**: popularity trackers and salary signals.
5. **AI-assisted development**: how to work with coding assistants responsibly.
6. **Career stages**: internship, junior and mid-level checklists; how deep to go at each stage; choosing a language; the QA perspective (including why ISTQB certifications are tool- and language-agnostic); a **five-phase structured learning path** with goals, builds and "done when" criteria; the learning sequence; project progression; common mistakes.

Study tools:

- A **quiz after each part** (6 quizzes), a **self-check**, and a scored **final exam** (17 questions, pass mark 70%).
- **Review my mistakes** collects every missed question until you answer it correctly.
- **Progress summary** in the header, **search** across all sections, a **theme** toggle (auto, light, dark), and a print layout (Ctrl+P when opened locally).
- A **Practice** list of free sites checked in September 2026: freeCodeCamp, The Odin Project, Codewars, Advent of Code, Go by Example, Rust by Example, Learn Git Branching, SQLBolt, PostgreSQL Exercises, Use The Index, Luke and roadmap.sh.

### Role Modules view

Three role tracks: **Internship**, **Junior** and **Mid-level**. Each track has:

- an overview, what employers expect, and typical first tasks
- 5–6 lessons, each with notes for Python, TypeScript/JavaScript, Java, C#, Go, Rust and SQL where relevant, plus a code example
- a table of which languages matter at that level
- a **module quiz** (6 questions, instant feedback) and a **role exam** (12 questions, pass mark 70%)

The whole interface and all content are available in **English, Ukrainian, Polish and Spanish**. Code and code comments stay in English, as in real codebases.

## Editing content

**Hub:** all tables, checklists, quizzes, the exam, code examples and links live in one `DATA` object at the top of the `<script>` block in `Programming-Languages-Hub.html`. Longer text is plain HTML. A quiz or exam row looks like this:

```js
["Question?", ["Answer A", "Answer B", "Answer C", "Answer D"], 2, "Explanation shown after answering."]
//                                                               ^ index of the correct answer, counting from 0
```

The number of questions and the pass mark update automatically.

**Role Modules:** edit the JSON files in `role-modules/content/`.

After any change, rebuild (or just run `python serve.py`, which rebuilds first):

```sh
python build.py
```

The build fails if any translation differs from `en.json` in structure: a missing question, a different number of options, a different correct answer, a changed code-example id, or a missing `{placeholder}`. This keeps the four languages marking the same answers as correct.

## Where progress is stored

Checklist ticks, quiz and exam scores, the review list and the chosen theme and language are saved in the viewer's own browser (`localStorage`). Nothing is sent anywhere, and each person and device starts with a blank slate. The **Clear my progress** / **Clear my scores** buttons reset it.

## Verification and security

- The page scripts were exercised in a headless browser (jsdom): every section renders, quizzes and exams score correctly, and there are no script errors.
- Code examples: the Python, TypeScript, Java (21) and C# (.NET 10) snippets in the hub were run and produce the expected output. The SQL examples were run against SQLite. The Go and Rust snippets, and the code examples in Role Modules, were reviewed but not compiled.
- All external links returned HTTP 200 in September 2026.
- Security review: no secrets in the repository; no `eval` or other dynamic code; all external links use `rel="noopener"`; the only external resource loaded is Google Fonts. All displayed content comes from the pages' own data. Values read back from `localStorage` are validated (whole numbers only) before they reach the page, so tampered storage cannot inject HTML.
- The local server binds to 127.0.0.1, serves only `/` and `/index.html` (source files, folders and `.git` return 404), and sends `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- The Aikido security scan was not run, because it requires signing in to Aikido.

# Programming Languages Hub

A study hub that takes a learner from **internship** to **junior** to **mid-level** developer. It covers how programming languages work, the 2026 language landscape, SQL and databases, a structured learning path, and a quiz after every part. A companion app, **Role Modules**, goes deeper into each career level in four languages.

Everything runs in the browser as plain HTML, CSS and JavaScript. There is no framework, no server and nothing to install.

## Live pages

| Page | Link |
|---|---|
| Programming Languages Hub | https://claude.ai/artifact/4MAQg6U7GzJAtDMjrtQH5C |
| Role Modules (EN · UK · PL · ES) | https://claude.ai/artifact/WTh6NaFQPy3VA1RBE8HkGF |

Both pages are private until the owner shares them. To use them offline, open the HTML files from this repository directly in a browser.

## What's inside

```
Programming-Languages-Hub.html                  the main study hub (single file)
Role-Modules.html                               built companion app (generated, do not edit by hand)
Programming-Languages-Learning-Map-Expanded.md  the full guide as a Markdown document
role-modules/
  content/en.json, uk.json, pl.json, es.json    all Role Modules text, one file per language
  template.html                                 page layout, styles, code examples and logic
  build.py                                      validates the translations and builds Role-Modules.html
design-system/                                  colour tokens, type and page patterns (PL Hub)
```

### Programming Languages Hub

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

### Role Modules

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

**Role Modules:** edit the JSON files in `role-modules/content/`, then rebuild:

```sh
python role-modules/build.py
```

The build fails if any translation differs from `en.json` in structure: a missing question, a different number of options, a different correct answer, a changed code-example id, or a missing `{placeholder}`. This keeps the four languages marking the same answers as correct.

## Where progress is stored

Checklist ticks, quiz and exam scores, the review list and the chosen theme and language are saved in the viewer's own browser (`localStorage`). Nothing is sent anywhere, and each person and device starts with a blank slate. The **Clear my progress** / **Clear my scores** buttons reset it.

## Verification and security

- The page scripts were exercised in a headless browser (jsdom): every section renders, quizzes and exams score correctly, and there are no script errors.
- Code examples: the Python, TypeScript, Java (21) and C# (.NET 10) snippets in the hub were run and produce the expected output. The SQL examples were run against SQLite. The Go and Rust snippets, and the code examples in Role Modules, were reviewed but not compiled.
- All external links returned HTTP 200 in September 2026.
- Security review: no secrets in the repository; no `eval` or other dynamic code; all external links use `rel="noopener"`; the only external resource loaded is Google Fonts. All displayed content comes from the pages' own data. Values read back from `localStorage` are validated (whole numbers only) before they reach the page, so tampered storage cannot inject HTML.
- The Aikido security scan was not run, because it requires signing in to Aikido.

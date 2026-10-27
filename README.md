# Programming Languages Hub

A study hub that takes a learner from **internship** to **junior** to **mid-level** developer. It covers how programming languages work, the 2026 language landscape, SQL and databases, a structured learning path, and a quiz after every part. **Role modules**, a section near the end of the page, go deeper into each career level. Everything lives in one page, `index.html`, and **the whole app is available in English, Ukrainian, Polish and Spanish**.

Everything runs in the browser as plain HTML, CSS and JavaScript. There is no framework, no server and nothing to install.

## Run it

**Online:** <https://claude.ai/artifact/4MAQg6U7GzJAtDMjrtQH5C> (private until the owner shares it).

**Locally**, you need Python 3.9 or newer:

```sh
python serve.py
```

This rebuilds `index.html`, starts a server at <http://127.0.0.1:8000/> and opens it in your browser. Press Ctrl+C to stop it.

| Option | Effect |
| --- | --- |
| `--port 9000` | Use another port |
| `--no-build` | Serve the existing `index.html` without rebuilding |
| `--no-open` | Don't open a browser tab |

The server listens on `127.0.0.1` only, so other machines can't reach it, and it serves nothing but the app page (every other path returns 404). You can also open `index.html` directly from disk with no server.

**The app bar** stays at the top of the page and controls everything:

| Control | What it does |
| --- | --- |
| **Programming Languages Hub** (brand) | Jumps back to the top. Links can open any section directly, such as `#sql` or `#roles`. |
| **EN · UA · PL · ES** | Switches the language of the whole app: every section, table, checklist, quiz, exam and role module. Your ticks, scores and review list are kept. |
| **Theme** | Cycles auto, light and dark. |

On first visit the language follows the browser's language if it's one of the four, otherwise English. The choice is remembered.

## What's inside

```
index.html                                      the app: Study hub modules, including Role modules (generated, do not edit by hand)
build.py                                        validates the translations and builds index.html (with the app bar)
serve.py                                        builds, then serves the app on 127.0.0.1
hub/
  content/en.json, uk.json, pl.json, es.json    all Study hub text: interface strings, sections (HTML) and data
  sections.json                                 section order
  template.html, hub.js                         Study hub styles, markup and logic
role-modules/
  content/en.json, uk.json, pl.json, es.json    all Role Modules text, one file per language
  template.html                                 Role Modules layout, styles, code examples and logic
Programming-Languages-Learning-Map-Expanded.md  the full guide as a Markdown document (sections 20-22 mirror the pitfalls, test-design and terminal-check material)
design-system/                                  colour tokens, type and page patterns (PL Hub)
tests/smoke.js                                  jsdom smoke test, run by CI
.gitlab-ci.yml                                  CI: rebuild and compare index.html, then the smoke test
```

### Study hub sections

36 sections in seven parts, each part followed by a quiz:

1. **Foundations**: what a language is; language vs. runtime, library and framework; how code gets executed (AOT, bytecode + VM, interpreters and JIT, transpilation).
2. **Concepts that transfer**: core concepts, type systems, memory models, and **Same task, six languages**, which shows 4 everyday tasks in Python, TypeScript, Java, C#, Go and Rust.
3. **Writing safer code**: **Common pitfalls by language**. A tickable list of ten habits that apply everywhere, a language picker (Python, JavaScript/TypeScript, Java/Kotlin, C#/.NET, Go, PHP, Ruby, Rust, C/C++, SQL, Bash/PowerShell, infrastructure as code and CI) listing the security and reliability traps and the linters and scanners that catch them, and **six risky-vs-safer code pairs** (Python, JavaScript, Java, C#, SQL, Bash). Each pair was run, and its comment describes what it printed.
4. **SQL & database programming**: SQL as a declarative domain-specific language, core skills, tickable internship/junior/mid progression, runnable examples (joins, CTEs, transactions, indexes and plans, parameterised queries) and a dialect comparison (PostgreSQL, MySQL, SQL Server, Oracle, SQLite).
5. **The 2026 landscape**: popularity trackers and salary signals.
6. **AI-assisted development**: how to work with coding assistants responsibly.
7. **Career stages**: internship, junior and mid-level checklists; how deep to go at each stage; choosing a language; the QA perspective (including why ISTQB certifications are tool- and language-agnostic); **Test design in practice** (eight techniques, a boundary-value generator, a severity calculator on the impact × likelihood scale, and the anatomy of a bug report with a copyable Markdown template); a **five-phase structured learning path** with goals, builds and "done when" criteria; the learning sequence; project progression; common mistakes.

A **Quick reference** section closes the hub with five cheat sheets: Big-O complexity at a glance, everyday Git commands, HTTP status codes, common regex patterns and **read-only terminal checks** for Linux, Windows (PowerShell) and macOS (failed services, CPU, memory, disk, listening ports, firewall, recent errors, pending updates, system protection, runtime versions).

Study tools:

- A **quiz after each part** (8 quizzes), a **self-check**, and a scored **final exam** (17 questions, pass mark 70%).
- Keyboard and screen-reader support for the quizzes: after you answer, focus moves to the explanation (the pressed button is disabled and would otherwise drop focus), and the graded exam result receives focus so it is read out. Tab groups keep focus on the tab you pressed.
- **Review my mistakes** collects every missed question until you answer it correctly.
- **Progress summary** in the header, **search** across all sections, a **theme** toggle (auto, light, dark), and a print layout (Ctrl+P when opened locally).
- The hero has quick links straight to the fundamentals, the final exam and Role Modules. A **reading-progress bar** and a **back-to-top** button appear as you scroll, and the section list collapses into a tap-to-open menu on narrow screens.
- A **Practice** list of free sites checked in September 2026: freeCodeCamp, The Odin Project, Codewars, Advent of Code, Go by Example, Rust by Example, Learn Git Branching, SQLBolt, PostgreSQL Exercises, Use The Index Luke, roadmap.sh, Exercism, LeetCode, SQL Murder Mystery and Frontend Mentor.
- A **Docs** list of official references and guides, including the Pro Git book, Refactoring Guru's design patterns, The System Design Primer, Real Python and The Twelve-Factor App, alongside the per-language official docs.

### Role modules section (section 31 of the hub)

Three role tracks: **Internship**, **Junior** and **Mid-level**. Each track has:

- an overview, what employers expect, and typical first tasks
- 5–6 lessons, each with notes for Python, TypeScript/JavaScript, Java, C#, Go, Rust and SQL where relevant, plus a code example
- a table of which languages matter at that level
- a **module quiz** (6 questions, instant feedback) and a **role exam** (12 questions, pass mark 70%)

Code and code comments stay in English in every language, as in real codebases.

## Editing content

All text lives in JSON, one file per language:

- **Study hub:** `hub/content/<lang>.json` has `ui` (buttons and labels), `hero`, `sections` (each section's HTML) and `data` (tables, checklists, the learning path, quizzes, the exam, code notes and links).
- **Role modules:** `role-modules/content/<lang>.json`. The section's heading and intro come from its `ui.title` and `ui.lede`, copied into the hub's `roles` section in `hub/content/<lang>.json`.

`en.json` is the reference. Source code and URLs exist only there; the other languages leave out `code` keys (and `bad`/`good` in `pitfallCode`) and use `null` for URLs and numbers, and the build fills them in from English. Language names and the shell commands in `terminal` must stay identical to English. A hub quiz or exam row looks like this:

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

- The page scripts are exercised in a headless browser (jsdom) by `tests/smoke.js`, in a wide and a narrow viewport and in all four languages: all 36 sections render, there are no duplicate ids, unnamed controls or broken in-page links, switching language keeps progress and section structure, quizzes score correctly, focus lands on the explanation after an answer, and the pitfalls picker, boundary-value generator, severity calculator and terminal table behave as described. The test was also run against the previous build to confirm that its new checks fail there. CI runs it with a pinned jsdom.
- The build's translation check was negative-tested for the new content: nine deliberate breakages (a translated shell command, a changed language tab name, a missing list item, a changed correct-answer index, a missing `<option>`, a missing element id, a lost placeholder, a short checklist, a short table) were each rejected.
- Layout was checked in headless Chrome at desktop and 390 px widths, in light and dark themes and in Ukrainian and Polish. That caught a real bug: a select with a long label stretched the page sideways on phones. Sections now use `minmax(0, 1fr)` columns so a wide child scrolls or shrinks instead.
- Code examples: the Python, TypeScript, Java (21) and C# (.NET 10) snippets in the hub were run and produce the expected output. The SQL examples were run against SQLite. The six risky-vs-safer pairs in *Common pitfalls by language* were each run too: Python 3.13 (the list leaks between calls), JavaScript in jsdom (`innerHTML` creates an `<img>` element, `textContent` creates none), Java 21 (the interrupt flag is lost when swallowed), C# on .NET 10 (`async void` crashes the process with an unhandled exception, `async Task` is caught), SQL on SQLite (concatenation returns all three rows, the parameterised query none) and Bash from Git for Windows (unquoted `rm $file` deleted an unrelated file named `my`). Of the terminal cheat sheet, only the Windows memory, disk, firewall and stopped-services commands were run here; the rest, and all the Linux and macOS commands, come from the read-only command list this material is based on and **were not run**. The Go and Rust snippets, and the code examples in Role Modules, were reviewed but not compiled.
- External links were re-checked on 27 October 2026: 32 of 34 return HTTP 200. leetcode.com and realpython.com return an automated-request block (HTTP 403) to a scripted request; both are live, well-known sites in a browser, but that was not re-confirmed in one.
- Security review: no secrets in the repository; no `eval` or other dynamic code; all external links use `rel="noopener"`; the only external resource loaded is Google Fonts. All displayed content comes from the pages' own data. Values read back from `localStorage` are validated (whole numbers only) before they reach the page, so tampered storage cannot inject HTML. The September 2026 UI/UX update (Quick reference tables, hero CTAs, back-to-top button, reading-progress bar, collapsible TOC, favicon) was diff-reviewed for new attack surface: no new `localStorage` reads, URL/hash parsing, `eval`, or external resources were introduced, and the new data tables render through the same build-time, translator-authored (non-user-input) content path already used by every other table on the page. No findings.
- The local server binds to 127.0.0.1, serves only `/` and `/index.html` (source files, folders and `.git` return 404), and sends `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` and a Content-Security-Policy that allows only the inline script and style, Google Fonts and `data:` images, and forbids framing, forms and other requests. The page was loaded over HTTP in Chrome under that policy: it renders with its fonts and Chrome logged no violations. The policy needs `'unsafe-inline'` because the build inlines everything; hashing the scripts would tighten it.
- The page still loads fonts from Google Fonts, so each visit tells Google the visitor's IP address. Self-hosting the fonts would remove that third-party request; it has not been done.
- A QA and design review of the project (using the QA-verification and professional-design material) found no defects in the build, the existing tests, colour contrast (all text pairs are at least 5.2:1, control borders at least 3.5:1) or links. It found and fixed: quiz feedback that screen readers were never told about and keyboard focus lost after answering (WCAG 2.4.3, 4.1.3), tab groups that dropped focus when redrawn, command and regex tables set in a proportional font, and an unpinned CI test dependency.
- Not done: a real screen-reader pass, testing in Safari and Firefox, and a native-speaker review of the new Ukrainian, Polish and Spanish text.
- Translations were written with AI assistance; a native-speaker review is recommended before wide sharing.
- The Aikido security scan was not run, because it requires signing in to Aikido.

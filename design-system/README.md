# PL Hub

The visual language of the **Programming Languages Hub**: a study guide that takes a learner from Internship to Junior to Mid-level. It should feel like a well-kept engineering notebook: calm paper, precise mono labels, and three level colours that tell you at a glance where a skill belongs.

## Content fundamentals

- Plain, direct sentences. Explain the *why* behind each concept ("Types: rules describing which operations are valid").
- Name levels exactly: **Intern**, **Junior**, **Mid**. Never "beginner/advanced".
- Real terms of art over metaphors: runtime, bytecode, JIT, transpilation, fixtures.
- Checklists are phrased as abilities: "Can reproduce a defect before fixing it."

## Visual foundations

- Ground is `paper`; content that is an object (tables, code, quiz) sits on `surface` with a `line` hairline and `radius-md`. No shadows.
- `brand` teal is the only accent for interaction. Level colours are semantic: `brand` = Intern, `junior` = Junior, `mid` = Mid. Use them for pills, progress bars and markers only, never for large text blocks.
- `mid` also flags pitfalls (Common mistakes).
- Decorative hairlines use `line`; the edges of interactive controls use `control` so they stay visible (3:1). Touch targets are at least 36px, and 44px on coarse pointers.
- Bricolage Grotesque has no Cyrillic, so the display stack falls back to Manrope for Ukrainian headings.
- Code and execution pipelines use `code-bg` / `code-ink` in both themes.
- Type: Bricolage Grotesque for headings, Source Sans 3 for reading (max ~68ch), JetBrains Mono for labels, level tags and code. Labels are uppercase mono with 0.06em tracking.
- Spacing on a 4px base: `space-4` inside panels, `space-6` between blocks, `space-12` between sections.

## Iconography

No icon set. Structure is carried by mono labels, level pills and section numbers (the guide's own 1–17 numbering). No emoji.

## Page patterns (Hub)

- **Tip panel**: `brand-tint` ground, uppercase mono label in `brand`. For career lenses, interview checks, plans and portfolio advice.
- **Note**: hairline `line` border, `muted` text. For caveats and consequences.
- **Deep-dive steps**: numbered list whose counters sit on `code-bg` chips; only for real sequences.
- **Stat tiles**: `surface` panels with a mono label and a display-face value; used for the 2026 landscape only.
- **Range bars**: salary ranges on one linear scale; `brand` for base ranges, `mid` for a specialisation premium.
- **Level pills**: outlined in the level colour (`brand` Intern, `junior`, `mid`).

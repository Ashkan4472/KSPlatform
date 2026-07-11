# Implementation Plan: Extension New-Tab Visual Redesign

**Branch**: `008-extension-redesign` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-extension-redesign/spec.md`

## Summary

Restyles the extension's existing new-tab feed (`App.tsx`, `FeedItem.tsx`,
`styles.css`) to the approved "Index & Ink" direction: a computed,
locally-reimplemented `tagColor()` (same algorithm as specs/007's), a
colored spine per item, hover feedback, and matching typography/spacing —
applied identically to the populated feed, empty state, connect prompt,
and offline state that specs/004 already built. No functional/behavioral
change to auth, fetching, or pagination.

## Technical Context

**Language/Version**: TypeScript + React 19 (extension's existing
separate Vite build, per specs/004)

**Primary Dependencies**: None new — no Tailwind added to the extension
(specs/004's plan already decided against it); plain CSS custom
properties, consistent with the extension's existing `styles.css`.

**Storage**: N/A — no data model touched.

**Testing**: `cd extension && npx tsc --noEmit && npm run lint`; manual
verification in Chrome and Firefox per specs/004's existing cross-browser
requirement.

**Target Platform**: The existing `extension/` sub-project's new-tab page.

**Project Type**: Restyle within the existing extension sub-project — no
new files beyond a small tag-color utility.

**Performance Goals**: N/A — CSS/markup change only.

**Constraints**: MUST NOT change specs/004's functional behavior (FR-005)
— every existing acceptance scenario from specs/004 must still pass
unchanged; only the visual presentation of those same states changes.

**Scale/Scope**: 1 new file (`extension/src/lib/tagColor.ts`), edits to
`extension/src/newtab/FeedItem.tsx`, `extension/src/newtab/App.tsx`, and
`extension/src/newtab/styles.css`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Reuse Before Reinvention**: PASS — reuses specs/007's `tagColor()`
  algorithm (same hash/palette logic, necessarily duplicated across the
  build boundary per specs/004's established precedent — the extension
  and main app share no build step) rather than inventing a different
  color scheme for the extension.
- **II. Mutations Are Server Actions (Web App)**: N/A — no mutations, no
  server actions; purely a client-side restyle in a separate sub-project.
- **III. Version-Pinned Correctness**: N/A — no framework-version-
  sensitive code touched.
- **IV. Composable, Disjoint Design Tokens**: N/A for the 9-axis system
  (the extension was never part of it, per specs/004's plan); the new
  extension-local CSS custom properties are self-contained to
  `extension/src/newtab/styles.css`.
- **V. Evidence-Driven Refactoring**: N/A — new/visual work, not a
  refactor.
- **VI. No Speculative Abstraction**: PASS — restyles exactly the states
  specs/004 already built; does not add new functional states or a
  generic theming system for the extension.
- **VII. External-Client API Is a Deliberate, Scoped Exception**: N/A —
  no API surface touched.

No unjustified violations. Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/008-extension-redesign/
├── plan.md              # This file
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks)
```

research.md and contracts/ are omitted: no NEEDS CLARIFICATION unknowns,
no external interface.

### Source Code (repository root)

```text
extension/
└── src/
    ├── lib/
    │   └── tagColor.ts          # NEW: same algorithm as src/lib/tagColor.ts (007)
    └── newtab/
        ├── FeedItem.tsx          # spine + tag color via tagColor.ts
        ├── App.tsx               # restyle empty/connect/offline states
        └── styles.css            # Index & Ink tokens (paper/ink/6 hues),
                                  # hover transitions, respects
                                  # prefers-reduced-motion
```

**Structure Decision**: No new directories — edits within the existing
`extension/` sub-project structure from specs/004.

## Complexity Tracking

No constitution violations — table not needed.

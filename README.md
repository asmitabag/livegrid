# LiveGrid — Real-time Spreadsheet Editor

LiveGrid is a minimal, production-style spreadsheet editor built with **Next.js**, **TypeScript**, and **Firebase Firestore**. It supports real-time collaboration (cells + presence), spreadsheet-like editing interactions, basic formulas, per-cell formatting, and export.

This project was built as an internship submission focusing on correctness, clarity, and reviewability.

---

## 1) Project overview

**What it is:**  
A collaborative spreadsheet editor where multiple users can edit the same grid concurrently.

**Core features:**
- Real-time cell sync via Firestore
- Spreadsheet keyboard navigation + inline editing
- Formula bar with spreadsheet-like behavior
- Simple formula engine (`=A1+1`, `=SUM(A1:B2)`)
- Per-cell formatting: bold / italic / text color
- Column/row resizing and column reordering
- Export to CSV and JSON
- Collaborator presence (avatars + current selected cell)

---

## 2) Implemented assignment requirements

### Editing + navigation
- Arrow keys move the selection
- Tab / Shift+Tab moves right/left
- Enter / Shift+Enter moves down/up
- Typing starts editing the selected cell
- Double click enters edit mode
- Escape cancels editing
- Enter commits edits

### Formula bar
- Always reflects the selected cell **raw value**
- Editing formula bar edits the selected cell
- Enter commits, Escape cancels
- Behavior is consistent with inline editing

### Formatting
- Per-cell: bold / italic / text color
- Formatting is stored in Firestore and applied in both cells and formula bar context where relevant

### Toolbar
- Bold toggle, Italic toggle, Color picker
- Indicators reflect formatting of selected cell
- Export buttons (CSV / JSON)

### UX polish
- Hover states, selection outline, subtle grid lines
- Sticky headers
- Polished transitions and focus rings

---

## 3) Implemented bonus features

- **Column resizing** (drag handle on headers; persisted per document)
- **Row resizing** (drag handle on row headers; persisted per document)
- **Column reordering** (drag headers; persisted per document)
- **Export**
  - CSV: visible displayed values (computed)
  - JSON: raw values + formatting + layout metadata

**Formula limitation during reordering:**  
Columns are reordered visually using a `colOrder` mapping, but formulas are **not rewritten** (e.g. `=A1` still refers to the underlying A column index). This keeps formula semantics safe/predictable without complex rewrite logic.

---

## 4) Architecture overview

High-level flow:
- Firestore provides real-time cell updates via subscriptions.
- The editor keeps local UI state (selection, editing draft, optimistic writes).
- The formula engine computes display text for formula cells.
- Presence is tracked separately (heartbeat + selected cell).

Key goals:
- Keep state localized and easy to reason about
- Avoid unnecessary rerenders on large grids
- Keep Firestore writes small and sparse

---

## 5) Folder structure (key files)

- `src/app/` — Next.js App Router pages
- `src/components/`
  - `dashboard/` — document list + creation
  - `editor/` — toolbar, formula bar, grid, cell view
  - `presence/` — collaborator presence strip
- `src/lib/editor/`
  - `useSpreadsheetEditor.ts` — selection/edit state + optimistic writes
  - `useSpreadsheetEngine.ts` — formula engine view (incremental updates)
  - `useGridLayout.ts` — row/col sizing + reorder + export + persistence
- `src/lib/firestore/`
  - `cells.ts` — upsert + subscription helpers
  - `useDocumentCells.ts` — scoped cell subscription
  - `presence.ts` — presence CRUD + subscriptions
  - `documentLayout.ts` — per-document layout persistence
- `src/lib/formula/`
  - `tokenizer.ts`, `parser.ts`, `evaluator.ts`, `engine.ts`

---

## 6) Data model

### Firestore collections
- `documents/{docId}`
  - `layout`: `{ colOrder, colWidths, rowHeights }` (optional)
- `documents/{docId}/cells/{cellKey}`
  - `row`, `col`, `rawValue`, `formatting`, `updatedAt`, `updatedBy`
- `documents/{docId}/presence/{userId}`
  - `name`, `color`, `lastSeen`, `selectedCell`

### Cell formatting
Formatting is optional and stored per-cell:
- `bold?: boolean`
- `italic?: boolean`
- `textColor?: string`

---

## 7) Formula engine design and scope

Supported:
- `=A1` references
- arithmetic: `+ - * /`
- parentheses
- `SUM(A1:B2)` (rectangular ranges)

Design:
- Tokenize → parse to AST → evaluate with cycle detection
- Uses a dependency graph (`depsByCell` + reverse deps) to recompute only impacted formulas on changes
- Parse results are cached by formula string for performance

Not supported (intentionally out of scope):
- full Excel-compatible function set
- string concatenation, boolean logic, absolute refs (`$A$1`)
- formula rewrite during column reorder

---

## 8) Real-time sync strategy

- Cells are stored sparsely (only non-empty cells are written).
- UI uses optimistic local writes and merges with remote data.
- Firestore subscriptions keep the client updated in real time.

---

## 9) Presence implementation

- Each user writes a presence record with:
  - heartbeat timestamp
  - selected cell (debounced)
- UI displays collaborators as avatar chips.
- Stale presence is cleaned up best-effort.

---

## 10) Conflict resolution approach

- Last-write-wins at the cell document level (Firestore merge writes).
- Optimistic local overlay is cleared when remote matches local.

---

## 11) Optimization decisions

- Spreadsheet engine view updates are incremental (stable map references).
- Formula engine recomputes only impacted formulas when inputs change.
- Layout persistence is debounced.

---

## 12) Setup instructions

```bash
npm install
npm run dev
```

---

## 13) Environment variables

Create `.env.example`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
```

---

## 14) Deployment instructions

```bash
npm run build
npm run start
```

Recommended: deploy to Vercel and configure the same `NEXT_PUBLIC_FIREBASE_*` env vars.

---

## 15) Known limitations

- Formulas are intentionally limited (no full Excel function set).
- Column reorder does not rewrite formulas (safe visual reorder only).
- Large sheets are not virtualized (grid size is currently modest).

---

## 16) Future improvements

- Grid virtualization for very large sheets
- More functions and better error messages (`#REF!`, `#NAME?`)
- Import (CSV/JSON)
- Richer formatting (alignment, fill)
- Auth + document permissions (per-user access control)
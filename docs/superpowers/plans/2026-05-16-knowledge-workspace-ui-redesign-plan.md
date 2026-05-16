# Knowledge Workspace UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Typra's UI into the approved Concept D local knowledge workspace while preserving current Markdown editing, tabs, file operations, preview, Mermaid rendering, and build behavior.

**Architecture:** Add a new shell around the existing editor primitives instead of replacing the editor engine. Keep filesystem access through `fileOperations`/Electron IPC, keep CodeMirror in `CodeMirrorEditor`, and add derived client-side utilities for headings, tags, search, and backlinks.

**Tech Stack:** Electron, React 18, TypeScript, Zustand, CodeMirror 6, markdown-it, Mermaid, Vite.

---

## File Map

- Create `src/utils/documentInsights.ts`: pure Markdown-derived headings, tags, backlinks, and search helpers.
- Create `src/components/TopAppBar.tsx`: global search entry, command palette trigger, status, and shell actions.
- Create `src/components/WorkspaceSidebar.tsx`: sectioned file/recent/tag/search navigation shell.
- Create `src/components/InsightPanel.tsx`: preview, outline, backlinks, export tabs.
- Create `src/components/CommandPalette.tsx`: modal action launcher for existing commands.
- Modify `src/App.tsx`: replace old header/sidebar wiring with the new workspace shell.
- Modify `src/components/EditorContainer.tsx`: make it fit inside the new center workspace and remove duplicated chrome where needed.
- Modify `src/store/uiStore.ts`: add active sidebar section, active insight tab, command/search state, and panel toggles.
- Modify styles in `src/styles/*.css`: visual system, shell layout, sidebar, app bar, insight panel, command palette, responsive/focus states.

## Task 1: Baseline and Utilities

- [ ] Run `npm run build` before changes. Expected: TypeScript and Vite build pass or any pre-existing failure is documented.
- [ ] Create `src/utils/documentInsights.ts` with:
  - `extractHeadings(markdown)` returning heading level, text, slug, and line.
  - `extractTags(markdown)` supporting inline `#tag` and simple `tags:` frontmatter.
  - `searchDocuments(query, docs)` returning file/title/snippet matches.
  - `findBacklinks(target, docs)` matching filename, title, and `[[Title]]`.
- [ ] Run `npm run build`. Expected: pass.

## Task 2: UI Store Expansion

- [ ] Modify `src/store/uiStore.ts` to add:
  - `activeSidebarSection: 'files' | 'tags' | 'search' | 'recent'`
  - `activeInsightTab: 'preview' | 'outline' | 'backlinks' | 'export'`
  - `isCommandPaletteOpen`
  - `isGlobalSearchOpen`
  - setters/toggles for each.
- [ ] Keep existing fields and public methods compatible.
- [ ] Run `npm run build`. Expected: pass.

## Task 3: New Workspace Shell Components

- [ ] Create `TopAppBar`, `WorkspaceSidebar`, `InsightPanel`, and `CommandPalette` with typed props and no filesystem bypassing.
- [ ] Wire commands to existing actions where available: new file, open, save, preview toggle, focus mode, theme toggle.
- [ ] Use disabled states for unavailable export formats instead of fake behavior.
- [ ] Run `npm run build`. Expected: pass.

## Task 4: App Layout Integration

- [ ] Modify `src/App.tsx` to render:
  - top app bar
  - left workspace sidebar
  - center editor workspace with existing `TabBar` and `EditorContainer`
  - right insight panel
  - command palette
- [ ] Preserve existing Electron menu listeners and tab/file behavior.
- [ ] Ensure focus mode hides side panels and nonessential chrome.
- [ ] Run `npm run build`. Expected: pass.

## Task 5: Editor and Preview Recomposition

- [ ] Adjust `EditorContainer` so right-side preview can move into `InsightPanel` without losing split/edit-only/preview-only controls.
- [ ] Keep Mermaid rendering behavior localized and visible on errors.
- [ ] Keep preview zoom controls available in the preview tab.
- [ ] Run `npm run build`. Expected: pass.

## Task 6: Visual System and Polish

- [ ] Update CSS variables for Concept D: cool gray shell, white editor canvas, green accent, subtle purple secondary accent.
- [ ] Replace emoji-heavy buttons with mature text/icon-like controls where feasible using plain characters/CSS because no icon library is installed.
- [ ] Verify text does not overflow common toolbar, tab, sidebar, and panel controls.
- [ ] Run `npm run build`. Expected: pass.

## Task 7: Manual Smoke Test

- [ ] Run `npm run dev`.
- [ ] Launch `npm run electron:dev` in a second process.
- [ ] Verify: new/open/save, tabs, sidebar sections, preview/Mermaid, outline, backlinks, search, command palette, export tab disabled states, theme toggle, panel collapse, focus mode.
- [ ] Record any limitations in the final response.

## Notes

The project has no configured automated test runner. Do not add a large testing stack during this UI pass unless requested. Use pure utilities where possible so tests can be introduced later without rewriting feature code.

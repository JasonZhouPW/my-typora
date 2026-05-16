# Typra Knowledge Workspace UI Redesign

## Goal

Redesign Typra from a basic split-pane Markdown editor into a mature local knowledge workspace based on Concept D. The new UI should support daily professional writing, multi-document editing, search, organization, preview, outline navigation, backlink discovery, and export workflows while staying aligned with the current Electron, React, TypeScript, CodeMirror, and Zustand architecture.

## Product Direction

Typra remains a local-first Markdown editor. This redesign should not introduce cloud sync, a database service, plugin runtime, or a heavyweight indexing engine. Instead, it should build a polished workspace around files, open tabs, recent documents, and the current working directory.

The visual direction is a premium productivity app: light theme, crisp white editor canvas, cool gray chrome, restrained green primary accent, subtle purple secondary accents, dense controls, and no decorative marketing layout.

## Application Layout

The shell has four persistent regions:

1. **Top app bar**: global search, command palette entry, preview toggle, theme toggle, save/sync status, export button, and compact document context.
2. **Left workspace sidebar**: sectioned navigation for notebooks/files, tags, saved searches, and recent documents.
3. **Center editor workspace**: improved tab bar, Markdown editor canvas, optional inline formatting toolbar, and stable editor/preview layout controls.
4. **Right insight panel**: tabbed panel for live preview, outline, backlinks, and export queue/settings.

The layout must remain usable with either side panel collapsed. Focus mode should hide side panels and app chrome while keeping a clean writing surface.

## Functional Scope

### Workspace Sidebar

The existing `FileExplorer` and `RecentFiles` become part of a unified sidebar. Files are still read from the local filesystem through existing Electron IPC. Markdown-compatible files include `.md`, `.markdown`, and `.txt`.

Tags are derived locally from Markdown content using `#tag` patterns and optional frontmatter-style `tags:` entries. Saved searches can initially be local UI presets stored in Zustand/localStorage.

### Top App Bar

Global search should search open tabs first, then recent files and the current directory where available. The command palette should expose common actions such as new file, open file, save, toggle preview, focus mode, theme, and export.

Save status should reflect current tab state: unsaved, saved, modified, and last saved time where available.

### Editor Workspace

Keep CodeMirror as the core editor. The tab bar should be restyled and remain reorderable/closable. The editor area should support edit-only, preview-only, and split modes. Inline formatting controls may insert Markdown syntax into the active editor when editor access is available; otherwise they can begin as UI-visible disabled actions.

### Right Insight Panel

Preview uses the existing `markdownTransformer` and Mermaid rendering. Outline is generated from current document headings. Backlinks are computed from known local documents by finding references to the current file title, filename, or wiki-link style `[[Title]]`. Export starts with Markdown/HTML-oriented actions and clearly disabled PDF/DOCX actions until packaging support exists.

## State and Data Flow

Use existing Zustand stores where practical:

- `documentStore`: tabs, active document, recent files, modified state, save metadata.
- `uiStore`: panel visibility, active sidebar section, active insight tab, theme, focus mode, split mode.
- New derived utilities: heading extraction, tag extraction, backlink scanning, search result generation.

Renderer UI should call `fileOperations` for filesystem actions. Electron IPC boundaries remain in `electron/` and should not be bypassed.

## Components

Target component structure:

- `WorkspaceShell`: application shell and high-level layout.
- `TopAppBar`: global actions, search, command entry, status.
- `WorkspaceSidebar`: notebooks/files, tags, saved searches, recent documents.
- `EditorWorkspace`: tab bar, editor canvas, layout mode controls.
- `InsightPanel`: preview, outline, backlinks, export.
- `CommandPalette`: keyboard-driven action launcher.
- `GlobalSearch`: search input and results surface.

Existing components can be renamed or wrapped where useful, but behavior should be migrated incrementally.

## Error Handling

Filesystem errors should show concise in-app messages instead of only `alert()` or console output where practical. Unavailable export formats should be explicit disabled states. Mermaid render failures should remain localized to the preview pane.

## Testing and Verification

No test framework is currently configured. Baseline verification is `npm run build`. Manual smoke testing should cover opening files, editing, saving, tabs, sidebar navigation, preview/Mermaid rendering, search, outline, backlinks, theme toggle, panel collapse, and focus mode.

## Implementation Phasing

1. Build the shell layout and visual system around existing functionality.
2. Replace the header/sidebar/tab/toolbar presentation with the new Concept D structure.
3. Add right insight panel tabs: preview, outline, backlinks, export.
4. Add global search and command palette.
5. Add derived tags, saved searches, and polish states.

Each phase should keep the app buildable and preserve existing file editing behavior.

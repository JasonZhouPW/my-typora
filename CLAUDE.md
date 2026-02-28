# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Typra** is a Typora-like Markdown editor built with Electron, React, and TypeScript. It provides real-time Markdown preview with CodeMirror 6 editing and Mermaid diagram support.

## Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run electron:dev     # Run Electron app (requires dev server running first)

# Build
npm run build            # Build React frontend (TypeScript + Vite)
npm run electron:build   # Full build + package for current platform
npm run build:mac        # Build for macOS
npm run build:win        # Build for Windows
npm run build:linux      # Build for Linux
npm run build:all        # Build for all platforms

# Preview
npm run preview          # Preview production build
```

**Note:** No linting or testing framework is currently configured.

## Architecture

### Three-Layer Electron Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Renderer Process (React)                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │CodeMirror   │  │EditorContainer│  │Zustand Stores     │ │
│  │Editor       │  │(split view)   │  │(document,ui,editor│ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
│         │                  │                    │           │
│         └──────────────────┼────────────────────┘           │
│                            │                                │
│                    window.electronAPI                       │
└────────────────────────────┼────────────────────────────────┘
                             │ IPC
┌────────────────────────────┼────────────────────────────────┐
│ Main Process (Electron)    │                                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │menu.ts      │  │fileOperations│  │Window management   │ │
│  │(keyboard    │  │(IPC handlers)│  │                    │ │
│  │shortcuts)   │  │              │  │                    │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Directories

- `electron/` - Main process code (menu, file operations, window management)
- `src/` - Renderer process (React UI)
  - `src/components/` - React components (CodeMirrorEditor, EditorContainer)
  - `src/store/` - Zustand state stores
  - `src/utils/` - Utilities (file operations, markdown transformer)
- `docs/plans/` - Design documentation and implementation plans
- `build/` - Electron build resources (entitlements, etc.)

### State Management (Zustand)

Three stores manage application state:

- **documentStore** - File path, content, modified flag, undo/redo stack
- **uiStore** - Theme, view modes, panel visibility, slider position
- **editorStore** - Cursor position, selection, current block type

### IPC Communication

Renderer communicates with main process via `window.electronAPI`:
- `file.open()` - Open file dialog
- `file.save(filePath, content)` - Save file
- `file.saveAs(content)` - Save as dialog
- `on(channel, listener)` - Listen for menu events
- `removeListener(channel, listener)` - Remove listener

## Key Implementation Details

### Mermaid Rendering
Mermaid diagrams are extracted from markdown code blocks and rendered asynchronously in the preview pane using `mermaid.render()`. Placeholder divs are replaced with SVG output.

### Split-View Layout
EditorContainer manages a resizable split view between editor and preview using a drag handle. Position is stored in uiStore as `sliderPosition` (percentage).

### File Operations Flow
1. Menu action triggered (keyboard or click)
2. Main process sends IPC message to renderer
3. Renderer handles via `window.electronAPI.on()`
4. File operation executed via IPC handlers in `electron/fileOperations.ts`

## Design Documentation

Detailed design docs are in `docs/plans/`:
- `2026-01-26-markdown-editor-design.md` - Comprehensive architecture and feature design
- `2026-01-26-core-editor-implementation.md` - Implementation task breakdown
- `2026-01-28-file-explorer-toolbar-highlighting-design.md` - File explorer and toolbar design

## Current Implementation Status

**Implemented:**
- CodeMirror 6 editor with markdown support
- Real-time preview with markdown-it
- Mermaid diagram rendering
- File open/save/save-as operations
- Application menu with keyboard shortcuts
- Resizable split-view layout
- Zustand state management with undo/redo

**Not Yet Implemented:**
- File explorer sidebar
- Markdown toolbar
- Syntax highlighting themes
- PDF/DOCX export
- Table editor
- Image handling (paste, drag-drop)
- Auto-save
- Focus modes (typewriter, zen)
- Spell checking

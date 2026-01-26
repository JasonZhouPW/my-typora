# Markdown Editor Design Document

**Date**: 2026-01-26
**Project**: Typora-like Markdown Editor
**Type**: Electron Desktop Application

---

## Overview

A full-featured, seamless WYSIWYG Markdown editor built with Electron, providing real-time rendering, comprehensive Markdown support (tables, Mermaid diagrams, math formulas), theme customization, focus modes, and robust export functionality (PDF, DOCX, HTML).

---

## Architecture

### Technology Stack

- **Electron**: Cross-platform desktop application framework
- **React**: Frontend UI framework
- **CodeMirror 6**: Core editor component with decoration API
- **Zustand**: Lightweight state management
- **Markdown-IT**: Markdown parser with extensions
- **KaTeX**: LaTeX math rendering
- **Mermaid.js**: Diagram rendering
- **Puppeteer**: PDF export
- **mammoth.js / docx**: DOCX export

### Three-Layer Architecture

1. **Renderer Process**:
   - React UI with CodeMirror editor
   - Preview engine and decoration system
   - State management (Zustand)

2. **Main Process**:
   - Electron main thread
   - File system operations
   - Native menus and IPC communication

3. **File System Layer**:
   - File abstraction layer
   - Recent documents management
   - Auto-save functionality

### Real-Time Seamless Rendering

**Approach**: Dual-view using CodeMirror's decoration API
- Markdown text remains in the editor
- HTML decorations overlay for headings, bold, italic, code blocks, tables, etc.
- Decorations update instantly as you type
- Source and preview unified, not separate views (mirrors Typora's UX)

---

## Rendering Engine

### Markdown Parser Configuration (Markdown-IT)

**Core Features**:
- CommonMark spec compliance
- GitHub Flavored Markdown (GFM)

**Extensions**:
- `markdown-it-table`: Table support with alignment
- `markdown-it-deflist`: Definition lists
- `markdown-it-footnote`: Footnote support
- `markdown-it-sub` / `markdown-it-sup`: Subscript/superscript
- `markdown-it-math`: LaTeX math formulas (KaTeX backend)
- `markdown-it-mermaid`: Mermaid diagram rendering

### Mermaid Diagrams

**Rendering Strategy**:
- Embedded webview overlay within editor
- Renders Mermaid code blocks as SVG diagrams
- Syncs with CodeMirror position tracking
- Displayed seamlessly in document flow

**Implementation**:
- CodeMirror `ViewPlugin` manages widget lifecycle
- Webview communicates with main process to load Mermaid.js
- Diagrams exported as SVG for display/printing
- Double-click to edit diagram source

### Table Editing

**User Experience**:
- Tables rendered as HTML decorations
- Clicking cell switches to "edit mode"
- Embedded CodeMirror micro-editor within cell
- Direct manipulation while maintaining visual seamlessness

**Features**:
- Tab navigation between cells
- Auto-sizing rows/columns
- Row/column insertion/deletion
- Markdown syntax support within cells (nested formatting)

---

## Core Components

### 1. EditorContainer
**Purpose**: Main editor component wrapper

**Responsibilities**:
- Wraps CodeMirror editor with overlay rendering
- Manages decoration state (Markdown → HTML transformations)
- Coordinates between source text and visual preview
- Handles keyboard shortcuts for Markdown syntax

### 2. MarkdownTransformer
**Purpose**: Converts Markdown to CodeMirror decorations

**Responsibilities**:
- Parsing pipeline: text → AST → decorations
- Debounces parsing (prevents performance issues during rapid typing)
- Provides position mapping between source and rendered content
- Caches parsed results for performance

### 3. MermaidWidget
**Purpose**: Webview component for Mermaid diagrams

**Responsibilities**:
- Communicates with main process to load Mermaid.js
- Renders Mermaid code blocks as SVG
- Exports diagrams for display/printing
- Handles double-click to edit diagram source

### 4. TableEditor
**Purpose**: In-place editor for table cells

**Responsibilities**:
- Embedded CodeMirror instance for cell editing
- Tab/Enter navigation between cells
- Auto-expands tables (add rows/columns)
- Supports Markdown syntax within cells

### 5. ThemeManager
**Purpose**: Theme configuration and application

**Responsibilities**:
- Loads CSS themes from user themes directory
- Handles dark/light mode switching
- Provides theme API for customization
- Bundles 5-6 starter themes (minimal, github, solarized, etc.)

---

## State Management

### State Store (Zustand)

**Why Zustand**: Lightweight (3kb), no boilerplate, excellent TypeScript support

### State Slices

#### DocumentState
- Current file path and content
- Modified flag (unsaved changes)
- Auto-save status and last saved timestamp
- Undo/redo stack position

#### UIState
- Theme configuration (current theme, accent color)
- View mode (focus mode, typewriter mode, normal)
- Panel visibility (sidebar, table of contents, preview)
- Window dimensions and split ratios

#### EditorState
- Cursor position and selection
- Markdown syntax mode (current block type)
- Table editing state (active cell, edit mode)
- Visible scroll position

### Data Flow

```
CodeMirror Events → MarkdownTransformer → Decorations → View
        ↓                                            ↓
  EditorState.update() ←→ DocumentState ←→ Main Process
                                                ↓
                                          File System I/O
```

### IPC Communication (Electron)

- Main ↔ Renderer communication via `electron.ipcRenderer`
- File watching via `chokidar` in main process
- Detect external file changes
- Window state persistence for session restoration

---

## Key Features

### Differentiating Features

#### 1. Theme Customization
- Multiple bundled themes
- Dark/light mode switching
- Custom CSS support
- Theme preview before applying

#### 2. Focus Modes
- **Focus mode**: Fades out non-active content
- **Typewriter mode**: Centers current line vertically
- **Zen mode**: Full-screen, distraction-free writing
- Customizable opacity and fade levels

#### 3. Productivity Tools
- **Table editor**: In-place editing with auto-expansion
- **Math formulas**: LaTeX rendering via KaTeX
- **Diagrams**: Mermaid.js support (flowcharts, sequence diagrams, etc.)
- **Auto-format**: Prettier integration for consistent formatting
- **Table of contents**: Auto-generated navigation
- **Spell check**: Hunspell integration for multi-language support

---

## Export Functionality

### PDF Export

**Implementation**: Puppeteer (headless Chrome)

**Features**:
- Preserve theme styling in PDF output
- Dark/light mode support
- Page size options (A4, Letter, Custom)
- Configurable margins
- Include/exclude page numbers
- High-quality table and diagram rendering (Mermaid SVGs embedded)
- Font embedding for cross-platform consistency
- Print-friendly mode (remove UI chrome)

### DOCX Export

**Implementation Options**:
- Primary: `mammoth.js` for HTML → DOCX conversion
- Alternative: `docx` npm package for fine-grained control

**Features**:
- Preserve tables with formatting
- Maintain headings hierarchy
- Bold/italic/code formatting
- Image embedding
- Mermaid diagrams → PNG export before embedding
- Math formulas: Render as images or maintain LaTeX source
- Hyperlinks and cross-references

### Additional Export Formats

- **HTML export**: Clean, styled HTML for web publishing
- **Image export**: Export specific diagrams as PNG/SVG
- **Copy to clipboard**: Rendered HTML/rich text for pasting
- **Batch export**: Export all files in a directory
- **Export templates**: Pre-configured settings for different use cases

---

## Image Handling

### Supported Formats
- Bitmap: JPG, PNG, GIF, WEBP, SVG
- Clipboard paste: Auto-detect and insert
- Drag & drop: Direct insertion from file system
- Remote images: HTTP/HTTPS URLs with lazy loading
- Base64 encoded: Inline support for small images

### Rendering Strategy

#### Local Images
- Auto-render as HTML decorations
- Relative paths resolved relative to document location
- Size constraints: Max width = document width, maintain aspect ratio
- Click to preview in system viewer or lightbox modal

#### Remote Images
- Lazy load with placeholder while fetching
- Cache to temp directory for faster subsequent loads
- Error handling: Broken image icon with "Reload" button
- Alt text displayed on hover/focus (accessibility)

### Image Management UI
- Inline resizing: Drag corner handles, updates Markdown
- Right-click context menu: Open, copy, copy path, delete
- Image browser: Sidebar panel to view all images in document
- Batch operations: Resize multiple images, convert formats

### File Operations
- **Paste image**: Auto-save to `./images/` subdirectory
- **Insert image**: File picker dialog with preview
- **Image linking**: Auto-generate relative path Markdown
- **Image optimization**: Compress/optimize on save (using sharp)

### Special Features
- GIF support: Play/pause controls, looping option
- SVG support: Inline rendering with editable source
- Animated thumbnails: Static preview, animate on hover
- Image captions: `![alt](url "Caption")` rendered as figure

---

## Error Handling

### Error Tracking
- **Sentry**: Optional crash reporting
- **React Error Boundaries**: UI resilience

### Error Scenarios

#### File System Errors
- File not found / moved → Dialog to re-locate
- Permission denied → Error message, suggest different location
- Concurrent modification → Reload or overwrite prompt
- Disk full / I/O error → Error toast, prevent data loss

#### Parsing Errors
- Malformed Markdown → Graceful degradation, show source
- Mermaid syntax errors → Error placeholder with edit button
- Invalid LaTeX → Warning, display source
- Table structure errors → Raw Markdown, suggest fix

#### Rendering Errors
- Memory exhaustion → Virtual scrolling, loading indicators
- Decoration timeout → Fall back to raw Markdown, performance warning
- Theme loading failures → Default to light theme, error notification

### Data Recovery
- Auto-save to temp location every 30 seconds
- Crash recovery: Restore from temp file on startup
- Undo/redo stack persists in memory
- "Recover Unsaved" feature for abandoned drafts

---

## Testing Strategy

### Testing Framework
- **Vitest**: Unit and integration tests (fast, ESM support)
- **Playwright**: E2E testing (cross-platform UI automation)
- **Electron Tester**: Main process testing (by Electron Forge)

### Test Layers

#### Unit Tests
- Markdown parser: All syntax types → decorations
- TableEditor: Cell navigation, expansion, nested markdown
- MermaidWidget: Mock rendering, SVG output verification
- State management: Zustand store updates and persistence

#### Integration Tests
- Full parsing pipeline: Markdown → decorations → HTML
- IPC communication: File operations between main ↔ renderer
- Theme system: Load/apply/switch themes
- Auto-save workflow: Modified → save → recover

#### E2E Tests
- Typical user workflows: Create, type, add table, insert Mermaid, save
- Keyboard shortcuts: Markdown syntax triggers (Ctrl+B, Ctrl+I)
- File operations: Open, save, save as, recent files
- Focus mode: Toggle, verify distraction-free state
- Recovery scenarios: Crash, external file modification

### Test Coverage Targets
- Core editor logic: 90%+
- State management: 80%+
- IPC and file I/O: 75%+
- UI components: 70%+

### Performance Benchmarks
- Large file (10MB): <200ms render time after load
- Typing latency: <16ms (60fps) during normal editing
- Memory usage: <500MB for typical 100KB document

---

## Performance Considerations

### Rendering Performance
- Virtual scrolling for large documents
- Debounced parsing (300-500ms) during rapid typing
- Decoration caching and incremental updates
- Lazy loading of images and remote content

### Memory Management
- Efficient AST parsing and garbage collection
- Limited undo/redo stack size (configurable)
- Image compression and caching strategies
- Webview pooling for Mermaid diagrams

### Async Operations
- File I/O always non-blocking
- Background parsing for large files
- Incremental rendering for complex documents
- Worker threads for CPU-intensive operations (image optimization)

---

## Development Roadmap

### Phase 1: Core Editor (MVP)
- [ ] Electron app setup with React
- [ ] CodeMirror 6 integration
- [ ] Basic Markdown parsing and decoration
- [ ] Real-time seamless rendering
- [ ] File open/save operations

### Phase 2: Advanced Features
- [ ] Table editor with in-place editing
- [ ] Mermaid diagram support
- [ ] Math formula rendering (KaTeX)
- [ ] Image handling (paste, drag & drop, render)
- [ ] Theme system with bundled themes

### Phase 3: Export & Polish
- [ ] PDF export (Puppeteer)
- [ ] DOCX export
- [ ] Focus modes (focus, typewriter, zen)
- [ ] Error handling and recovery
- [ ] Performance optimization

### Phase 4: Advanced Features
- [ ] Spell checking (Hunspell)
- [ ] Table of contents navigation
- [ ] Auto-formatting (Prettier)
- [ ] Search and replace
- [ ] Keyboard customization

---

## Success Criteria

- Seamless WYSIWYG editing experience matching Typora
- Full Markdown spec compliance with extensions
- Sub-60fps rendering during typing
- Support for documents up to 10MB
- Reliable export to PDF and DOCX
- Cross-platform (macOS, Windows, Linux)
- Comprehensive test coverage (70%+)
- Memory usage under 500MB for typical workloads

---

## Open Questions

1. Should we include cloud sync features (Dropbox, Google Drive)?
2. Should we support collaborative editing (like Google Docs)?
3. Should we build a plugin system for extensibility?
4. Should we include a markdown linter/style checker?
5. Should we support publishing directly to platforms (GitHub, Medium)?

---

## Resources & References

- [CodeMirror 6 Documentation](https://codemirror.net/)
- [Markdown-IT Documentation](https://github.com/markdown-it/markdown-it)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Typora Website](https://typora.io/)
- [CommonMark Spec](https://spec.commonmark.org/)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)

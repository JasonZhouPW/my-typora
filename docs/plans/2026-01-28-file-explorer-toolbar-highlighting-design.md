# File Explorer, Toolbar, and Syntax Highlighting Design

## Overview

This design describes adding three major features to the Typora-like Markdown editor:

1. **File Explorer Sidebar**: Full file system navigation with file/folder management
2. **Markdown Toolbar**: Quick insertion of Markdown elements
3. **Syntax Highlighting**: Enhanced editor with bracket matching and theme support

---

## Feature 1: File Explorer Sidebar

### Scope
- Full file system access (not project/workspace limited)
- Navigate anywhere on the computer with proper permissions

### Operations Supported
- Add file
- Add folder
- Delete file/folder (with confirmation dialog)
- Rename file/folder
- Navigate directory tree

### UI Behavior
- Folders start collapsed by default, expand on click
- Resizable divider between sidebar and editor
- Right-click context menu for file operations

### Architecture

#### Main Process (Electron)
All file system operations go through Electron's main process for security:
- `readDirectory(path)`: Returns file tree structure
- `createFile(path, content)`
- `createFolder(path)`
- `rename(oldPath, newPath)`
- `delete(path)`

#### Renderer State (Zustand)
New `fileTreeStore`:
```typescript
{
  fileTree: TreeNode[]
  selectedFile: string | null
  expandedFolders: Set<string>
  sidebarWidth: number
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children: TreeNode[]
  isExpanded: boolean
}
```

#### Components
- `FileExplorer.tsx`: Main sidebar container
- `FileTreeNode.tsx`: Recursive component for tree items
- `ContextMenu.tsx`: Right-click menu

### Edge Cases
- Permission errors: Show friendly message
- Hidden files: Filter out system files by default
- Large directories: Lazy load contents
- External file changes: Refresh tree when file is saved

---

## Feature 2: Markdown Toolbar

### Position
- Always visible above the editor pane
- Replaces current "Hide Preview/Hide Editor" buttons

### Toolbar Buttons

#### Text Formatting
- Bold (`**text**`)
- Italic (`*text*`)
- Underline (`<u>text</u>`)
- Strikethrough (`~~text~~`)

#### Headings
- H1 (`# `)
- H2 (`## `)
- H3 (`### `)

#### Lists
- Bullet list (`- `)
- Numbered list (`1. `)
- Checklist (`- [ ] `)

#### Code & Media
- Code block (`` ` ``)
- Inline code (`` ` ``)
- Blockquote (`> `)
- Link (`[text](url)`)
- Image (`![alt](url)`)
- Table (opens dimension dialog)

### Components
- `MarkdownToolbar.tsx`: Main toolbar with all buttons
- `TableDialog.tsx`: Modal for table insertion (rows x columns)

### Interaction
- Clicking button inserts Markdown at cursor position
- Multiple selections apply formatting to all
- Links/images prompt for URL via inline input or dialog

---

## Feature 3: Syntax Highlighting

### Features
- Markdown syntax highlighting (headings, lists, code, etc.)
- Bracket matching (parentheses, brackets, quotes)
- Selection highlighting
- Current line highlight

### Theme Support
- Light and dark themes
- Auto-detects system preference via `window.matchMedia('(prefers-color-scheme: dark)')`
- Updates theme when system theme changes

### CodeMirror Extensions Required
- `@codemirror/highlight`: Syntax highlighting
- `@codemirror/bracket-matching`: Bracket pairs
- `@codemirror/highlight-selection`: Selection highlights
- `@codemirror/highlight-special-chars`: Invisible characters
- `@codemirror/themes`: Light/dark themes

### Implementation
Add extensions to `CodeMirrorEditor.tsx` in `EditorState.create()`:
```typescript
import { oneDark } from '@codemirror/theme-one-dark'
import { highlightSelection } from '@codemirror/highlight-selection'
import { bracketMatching } from '@codemirror/bracket-matching'

extensions: [
  markdown({ codeLanguages: languages }),
  bracketMatching(),
  highlightSelection(),
  // ... other extensions
]
```

---

## Layout Changes

### New Layout Structure
```
[File Explorer | Divider] [Toolbar]
[Editor | Divider | Preview]
```

### Updated EditorContainer Structure
- File explorer sidebar on left (width: configurable)
- Resizable divider #1 (sidebar ↔ editor/preview)
- MarkdownToolbar above editor
- Editor pane (existing)
- Resizable divider #2 (editor ↔ preview, existing)
- Preview pane (existing)

### Store Updates
- `uiStore`: Add `sidebarWidth`, `showSidebar`

---

## Error Handling

### File Operations
- Permission denied: Show toast/notification
- File not found: Refresh tree
- Delete non-empty folder: Confirm dialog
- Rename to existing name: Show error

### Toolbar Operations
- Invalid table dimensions: Validate before insert
- Missing URL for link/image: Prompt user
- No cursor position: Insert at document end

### File Sync
- External file deletion: Prompt to save as new location
- External file modification: Show "file changed" notification
- Active file deleted in explorer: Handle gracefully

---

## Testing

### Unit Tests
- FileTreeNode rendering states
- Toolbar button insert handlers
- Store state management
- Theme switching logic

### Integration Tests
- File explorer → Editor file opening
- Toolbar → Editor content updates
- Preview updates after toolbar insert
- Resizable dividers

### E2E Tests (Manual)
- Create/rename/delete files and folders
- All toolbar buttons insert correct syntax
- Theme follows system preference
- Keyboard shortcuts work with toolbar

### Performance
- `React.memo` for FileTreeNode
- Lazy load folder contents
- Debounce preview rendering

---

## Dependencies to Add

```
@codemirror/highlight
@codemirror/bracket-matching
@codemirror/highlight-selection
@codemirror/highlight-special-chars
@codemirror/theme-one-dark
```

---

## Implementation Steps

1. Add CodeMirror highlighting extensions
2. Create fileTreeStore and update uiStore
3. Build FileExplorer, FileTreeNode, ContextMenu components
4. Build MarkdownToolbar and TableDialog components
5. Update EditorContainer layout with sidebar and toolbar
6. Add Electron IPC handlers for file operations
7. Test and refine

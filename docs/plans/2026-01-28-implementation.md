# File Explorer, Toolbar, and Syntax Highlighting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add file explorer sidebar, Markdown toolbar, and syntax highlighting to the Typora-like Markdown editor.

**Architecture:** File explorer with full file system access, toolbar with Markdown insertion buttons, CodeMirror extensions for syntax highlighting and bracket matching with theme support.

**Tech Stack:** Electron, React, CodeMirror 6, Zustand, TypeScript

---

## Task 1: Install CodeMirror Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install highlighting extensions**

Run: `npm install @codemirror/highlight @codemirror/bracket-matching @codemirror/highlight-selection @codemirror/highlight-special-chars @codemirror/theme-one-dark`

Expected: Packages added to package.json and node_modules

**Step 2: Commit**

Run:
```bash
git add package.json package-lock.json
git commit -m "chore: install CodeMirror highlighting extensions"
```

---

## Task 2: Add Syntax Highlighting to CodeMirrorEditor

**Files:**
- Modify: `src/components/CodeMirrorEditor.tsx`

**Step 1: Update CodeMirrorEditor with highlighting extensions**

Replace entire file content with:

```typescript
import { useEffect, useRef } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { bracketMatching } from '@codemirror/bracket-matching'
import { highlightSelection } from '@codemirror/highlight-selection'
import { highlightSpecialChars } from '@codemirror/highlight-special-chars'
import { oneDark } from '@codemirror/theme-one-dark'

interface CodeMirrorEditorProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange?: (from: number, to: number) => void
}

export default function CodeMirrorEditor({
  content,
  onChange,
  onSelectionChange,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  // Detect system dark mode preference
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

  useEffect(() => {
    if (!containerRef.current) return

    const startState = EditorState.create({
      doc: content,
      extensions: [
        markdown({ codeLanguages: languages }),
        bracketMatching(),
        highlightSelection(),
        highlightSpecialChars(),
        isDarkMode ? oneDark : EditorView.theme({
          '&': { height: '100%', fontSize: '16px' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { padding: '20px' },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
          if (update.selectionSet && onSelectionChange) {
            const { from, to } = update.state.selection.main
            onSelectionChange(from, to)
          }
        }),
      ],
    })

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [isDarkMode])

  useEffect(() => {
    if (viewRef.current && content !== viewRef.current.state.doc.toString()) {
      const transaction = viewRef.current.state.update({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
      })
      viewRef.current.dispatch(transaction)
    }
  }, [content])

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
      }}
    />
  )
}
```

**Step 2: Commit**

Run:
```bash
git add src/components/CodeMirrorEditor.tsx
git commit -m "feat: add syntax highlighting and bracket matching to editor"
```

---

## Task 3: Create fileTreeStore

**Files:**
- Create: `src/store/fileTreeStore.ts`
- Modify: `src/store/index.ts`

**Step 1: Create fileTreeStore**

Create `src/store/fileTreeStore.ts`:

```typescript
import { create } from 'zustand'

export interface TreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children: TreeNode[]
  isExpanded: boolean
}

interface FileTreeState {
  fileTree: TreeNode[]
  selectedFile: string | null
  expandedFolders: Set<string>
  sidebarWidth: number
  setFileTree: (tree: TreeNode[]) => void
  setSelectedFile: (path: string | null) => void
  toggleFolder: (path: string) => void
  setSidebarWidth: (width: number) => void
}

export const useFileTreeStore = create<FileTreeState>((set) => ({
  fileTree: [],
  selectedFile: null,
  expandedFolders: new Set(),
  sidebarWidth: 250,

  setFileTree: (tree: TreeNode[]) => set({ fileTree: tree }),

  setSelectedFile: (path: string | null) => set({ selectedFile: path }),

  toggleFolder: (path: string) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders)
      if (newExpanded.has(path)) {
        newExpanded.delete(path)
      } else {
        newExpanded.add(path)
      }
      return { expandedFolders: newExpanded }
    }),

  setSidebarWidth: (width: number) => set({ sidebarWidth: width }),
}))
```

**Step 2: Export fileTreeStore from index.ts**

Update `src/store/index.ts`:

```typescript
export { useDocumentStore } from './documentStore'
export { useUIStore } from './uiStore'
export { useEditorStore } from './editorStore'
export { useFileTreeStore } from './fileTreeStore'
```

**Step 3: Commit**

Run:
```bash
git add src/store/fileTreeStore.ts src/store/index.ts
git commit -m "feat: add fileTreeStore for file explorer state"
```

---

## Task 4: Update uiStore with sidebar settings

**Files:**
- Modify: `src/store/uiStore.ts`

**Step 1: Add sidebar width to uiStore**

Replace file content with:

```typescript
import { create } from 'zustand'

interface UIState {
  theme: string
  darkMode: boolean
  viewMode: 'normal' | 'focus' | 'typewriter'
  showSidebar: boolean
  sidebarWidth: number
  showTableOfContents: boolean
  showPreview: boolean
  showEditor: boolean
  sliderPosition: number
  setTheme: (theme: string) => void
  setDarkMode: (dark: boolean) => void
  setViewMode: (mode: 'normal' | 'focus' | 'typewriter') => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  toggleTableOfContents: () => void
  togglePreview: () => void
  toggleEditor: () => void
  setSliderPosition: (position: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'default',
  darkMode: false,
  viewMode: 'normal',
  showSidebar: true,
  sidebarWidth: 250,
  showTableOfContents: false,
  showPreview: true,
  showEditor: true,
  sliderPosition: 50,

  setTheme: (theme: string) => set({ theme }),
  setDarkMode: (dark: boolean) => set({ darkMode: dark }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  setSidebarWidth: (width: number) => set({ sidebarWidth: width }),
  toggleTableOfContents: () => set((state) => ({ showTableOfContents: !state.showTableOfContents })),
  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
  toggleEditor: () => set((state) => ({ showEditor: !state.showEditor })),
  setSliderPosition: (position: number) => set({ sliderPosition: position }),
}))
```

**Step 2: Commit**

Run:
```bash
git add src/store/uiStore.ts
git commit -m "feat: add sidebar settings to uiStore"
```

---

## Task 5: Add File Explorer IPC Handlers

**Files:**
- Modify: `electron/fileOperations.ts`

**Step 1: Add file tree IPC handlers**

Replace entire file content with:

```typescript
import { ipcMain, dialog } from 'electron'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import os from 'os'

const HIDDEN_PATTERNS = ['.', 'node_modules', '.git', '.DS_Store', 'Thumbs.db']

export function registerFileHandlers() {
  // Existing file handlers
  ipcMain.handle('file:open', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown', 'txt'] }],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    const content = await fs.readFile(filePath, 'utf-8')
    return { path: filePath, content }
  })

  ipcMain.handle('file:save-as', async (_event, content: string) => {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown'] }],
    })

    if (result.canceled || !result.filePath) {
      return null
    }

    await fs.writeFile(result.filePath, content, 'utf-8')
    return result.filePath
  })

  ipcMain.handle('file:save', async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8')
    return true
  })

  // File tree handlers
  ipcMain.handle('file-tree:get-roots', async () => {
    const homeDir = os.homedir()
    const roots: any[] = []

    if (fsSync.existsSync(homeDir)) {
      roots.push({
        name: path.basename(homeDir),
        path: homeDir,
        type: 'folder',
        children: [],
        isExpanded: false,
      })
    }

    return roots
  })

  ipcMain.handle('file-tree:read-directory', async (_event, dirPath: string) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const nodes: any[] = []

      for (const entry of entries) {
        if (HIDDEN_PATTERNS.some(p => entry.name.startsWith(p))) {
          continue
        }

        const fullPath = path.join(dirPath, entry.name)
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? 'folder' : 'file',
          children: [],
          isExpanded: false,
        })
      }

      nodes.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name)
        }
        return a.type === 'folder' ? -1 : 1
      })

      return nodes
    } catch (error) {
      console.error('Error reading directory:', error)
      return []
    }
  })

  ipcMain.handle('file-tree:read-file', async (_event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      console.error('Error reading file:', error)
      return ''
    }
  })

  ipcMain.handle('file-tree:create-file', async (_event, dirPath: string, name: string) => {
    try {
      const fullPath = path.join(dirPath, name)
      await fs.writeFile(fullPath, '', 'utf-8')
      return { success: true, path: fullPath }
    } catch (error) {
      console.error('Error creating file:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('file-tree:create-folder', async (_event, dirPath: string, name: string) => {
    try {
      const fullPath = path.join(dirPath, name)
      await fs.mkdir(fullPath, { recursive: true })
      return { success: true, path: fullPath }
    } catch (error) {
      console.error('Error creating folder:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('file-tree:delete', async (_event, itemPath: string) => {
    try {
      const stats = await fs.stat(itemPath)
      if (stats.isDirectory()) {
        await fs.rm(itemPath, { recursive: true })
      } else {
        await fs.unlink(itemPath)
      }
      return { success: true }
    } catch (error) {
      console.error('Error deleting:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('file-tree:rename', async (_event, oldPath: string, newName: string) => {
    try {
      const dirPath = path.dirname(oldPath)
      const newPath = path.join(dirPath, newName)
      await fs.rename(oldPath, newPath)
      return { success: true, path: newPath }
    } catch (error) {
      console.error('Error renaming:', error)
      return { success: false, error: String(error) }
    }
  })
}
```

**Step 2: Update preload.ts with file tree API**

Update `electron/preload.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    saveAs: (content: string) => ipcRenderer.invoke('file:save-as', content),
    save: (filePath: string, content: string) => ipcRenderer.invoke('file:save', filePath, content),
  },
  fileTree: {
    getRoots: () => ipcRenderer.invoke('file-tree:get-roots'),
    readDirectory: (dirPath: string) => ipcRenderer.invoke('file-tree:read-directory', dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke('file-tree:read-file', filePath),
    createFile: (dirPath: string, name: string) => ipcRenderer.invoke('file-tree:create-file', dirPath, name),
    createFolder: (dirPath: string, name: string) => ipcRenderer.invoke('file-tree:create-folder', dirPath, name),
    delete: (itemPath: string) => ipcRenderer.invoke('file-tree:delete', itemPath),
    rename: (oldPath: string, newName: string) => ipcRenderer.invoke('file-tree:rename', oldPath, newName),
  },
  on: (channel: string, listener: (...args: any[]) => void) => {
 {
    ipcRenderer.on(channel, listener)
  },
  removeListener: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, listener)
  },
})

declare global {
  interface Window {
    electronAPI: {
      file: {
        open: () => Promise<{ path: string; content: string } | null>
        saveAs: (content: string) => Promise<string | null>
        save: (filePath: string, content: string) => Promise<boolean>
      }
      fileTree: {
        getRoots: () => Promise<any[]>
        readDirectory: (dirPath: string) => Promise<any[]>
        readFile: (filePath: string) => Promise<string>
        createFile: (dirPath: string, name: string) => Promise<{ success: boolean; path?: string; error?: string }>
        createFolder: (dirPath: string, name: string) => Promise<{ success: boolean; path?: string; error?: string }>
        delete: (itemPath: string) => Promise<{ success: boolean; error?: string }>
        rename: (oldPath: string, newName: string) => Promise<{ success: boolean; path?: string; error?: string }>
      }
      on: (channel: string, listener: (...args: any[]) => void) => void
      removeListener: (channel: string, listener: (...args: any[]) => void) => void
    }
  }
}
```

**Step 3: Commit**

Run:
```bash
git add electron/fileOperations.ts electron/preload.ts
git commit -m "feat: add file explorer IPC handlers"
```

---

## Task 6: Create FileTreeNode Component

**Files:**
- Create: `src/components/FileTreeNode.tsx`

**Step 1: Create recursive tree node component**

Create `src/components/FileTreeNode.tsx`:

```typescript
import React, { useState, useEffect } from 'react'
import { useFileTreeStore, type TreeNode } from '../store'

interface FileTreeNodeProps {
  node: TreeNode
  level: number
  onFileSelect: (path: string) => void
}

export default function FileTreeNode({ node, level, onFileSelect }: FileTreeNodeProps) {
  const { expandedFolders, toggleFolder } = useFileTreeStore()
  const [children, setChildren] = useState<TreeNode[]>([])
  const [loaded, setLoaded] = useState(false)
  const isSelected = useFileTreeStore((state) => state.selectedFile === node.path)
  const isExpanded = expandedFolders.has(node.path)

  const handleClick = async () => {
    if (node.type === 'folder') {
      toggleFolder(node.path)
      if (!loaded && !isExpanded) {
        try {
          const nodes = await window.electronAPI.fileTree.readDirectory(node.path)
          setChildren(nodes)
          setLoaded(true)
        } catch (error) {
          console.error('Error loading directory:', error)
        }
      }
    } else {
      onFileSelect(node.path)
    }
  }

  const icon = node.type === 'folder' ? (isExpanded ? '📂' : '📁') : '📄'
  const paddingLeft = level * 16 + 8

  return (
    <>
      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          paddingLeft: `${paddingLeft}px`,
          cursor: 'pointer',
          backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
          borderRadius: '4px',
          userSelect: 'none',
          fontSize: '14px',
          height: '28px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#e3f2fd' : '#f5f5f5'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#e3f2fd' : 'transparent'}
      >
        <span style={{ marginRight: '6px' }}>{icon}</span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {node.name}
        </span>
      </div>
      {isExpanded && children.map((child) => (
        <FileTreeNode key={child.path} node={child} level={level + 1} onFileSelect={onFileSelect} />
      ))}
    </>
  )
}
```

**Step 2: Commit**

Run:
```bash
git add src/components/FileTreeNode.tsx
git commit -m "feat: add FileTreeNode component"
```

---

## Task 7: Create FileExplorer Component

**Files:**
- Create: `src/components/FileExplorer.tsx`

**Step 1: Create file explorer sidebar component**

Create `src/components/FileExplorer.tsx`:

```typescript
import React, { useEffect } from 'react'
import { useFileTreeStore, type TreeNode } from '../store'
import FileTreeNode from './FileTreeNode'

interface FileExplorerProps {
  onFileSelect: (path: string) => void
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const { fileTree, setFileTree } = useFileTreeStore()

  useEffect(() => {
    async function loadRoots() {
      try {
        const roots = await window.electronAPI.fileTree.getRoots()
        setFileTree(roots)
      } catch (error) {
        console.error('Error loading file tree roots:', error)
      }
    }
    loadRoots()
  }, [setFileTree])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e0e0e0',
        fontWeight: 600,
        fontSize: '14px',
        color: '#424242',
      }}>
        Explorer
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {fileTree.map((node) => (
          <FileTreeNode key={node.path} node={node} level={0} onFileSelect={onFileSelect} />
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

Run:
```bash
git add src/components/FileExplorer.tsx
git commit -m "feat: add FileExplorer component"
```

---

## Task 8: Create TableDialog Component

**Files:**
- Create: `src/components/TableDialog.tsx`

**Step 1: Create table dimension dialog**

Create `src/components/TableDialog.tsx`:

```typescript
import React, { useState } from 'react'

interface TableDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (markdown: string) => void
}

export default function TableDialog({ isOpen, onClose, onInsert }: TableDialogProps) {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)

  if (!isOpen) return null

  const handleInsert = () => {
    const headerRow = '| ' + Array(cols).fill('').join(' | ') + ' |'
    const separatorRow = '| ' + Array(cols).fill('---').join(' | ') + ' |'
    const dataRows = Array(rows - 1).fill(0).map(() =>
      '| ' + Array(cols).fill('').join(' | ') + ' |'
    )

    const markdown = [headerRow, separatorRow, ...dataRows].join('\n') + '\n'
    onInsert(markdown)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        minWidth: '300px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Insert Table</h3>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Rows:</label>
          <input
            type="number"
            min="1"
            max="20"
            value={rows}
            onChange={(e) => setRows(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Columns:</label>
          <input
            type="number"
            min="1"
            max="10"
            value={cols}
            onChange={(e) => setCols(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#1976d2',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

Run:
```bash
git add src/components/TableDialog.tsx
git commit -m "feat: add TableDialog component"
```

---

## Task 9: Create MarkdownToolbar Component

**Files:**
- Create: `src/components/MarkdownToolbar.tsx`

**Step 1: Create toolbar component**

Create `src/components/MarkdownToolbar.tsx`:

```typescript
import React, { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../store'
import TableDialog from './TableDialog'

interface MarkdownToolbarProps {
  onInsertMarkdown: (text: { before: string; after: string } | string) => void
}

const BUTTONS = [
  { label: 'Bold', action: () => ({ before: '**', after: '**' }), title: 'Bold (Ctrl+B)' },
  { label: 'Italic', action: () => ({ before: '*', after: '*' }), title: 'Italic (Ctrl+I)' },
  { label: 'Strikethrough', action: () => ({ before: '~~', after: '~~' }), title: 'Strikethrough' },
  { label: 'H1', action: () => '# ', title: 'Heading 1' },
  { label: 'H2', action: () => '## ', title: 'Heading 2' },
  { label: 'H3', action: () => '### ', title: 'Heading 3' },
  { label: '•', action: () => '- ', title: 'Bullet list' },
  { label: '1.', action: () => '1. ', title: 'Numbered list' },
  { label: '[ ]', action: () => '- [ ] ', title: 'Checklist' },
  { label: '</>', action: () => ({ before: '```\n', after: '\n```' }), title: 'Code block' },
  { label: '`', action: () => ({ before: '`', after: '`' }), title: 'Inline code' },
  { label: '>', action: () => '> ', title: 'Blockquote' },
  { label: 'Link', action: () => ({ before: '[', after: '](url)' }), title: 'Link' },
  { label: 'Image', action: () => ({ before: '![', after: '](url)' }), title: 'Image' },
]

export default function MarkdownToolbar({ onInsertMarkdown }: MarkdownToolbarProps) {
  const { showPreview, togglePreview, showEditor, toggleEditor } = useUIStore()
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkText, setLinkText] = useState('')
  const linkInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showLinkDialog && linkInputRef.current) {
      linkInputRef.current.focus()
    }
  }, [showLinkDialog])

  const handleInsertLink = () => {
    if (linkText) {
      onInsertMarkdown(`[${linkText}](${linkText})`)
    }
    setShowLinkDialog(false)
    setLinkText('')
  }

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#fafafa',
        flexWrap: 'wrap',
      }}>
        {BUTTONS.map((btn, i) => (
          <button
            key={i}
            onClick={() => onInsertMarkdown(btn.action())}
            title={btn.title}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              minWidth: '32px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontWeight: btn.label.startsWith('H') ? 600 : 400,
            }}
          >
            {btn.label}
          </button>
        ))}
        <button
          onClick={() => setShowTableDialog(true)}
          title="Table"
          style={{
            padding: '6px 10px',
            fontSize: '13px',
            minWidth: '32px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          Table
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={togglePreview}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
        <button
          onClick={toggleEditor}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          {showEditor ? 'Hide Editor' : 'Show Editor'}
        </button>
      </div>
      <TableDialog
        isOpen={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        onInsert={onInsertMarkdown}
      />
      {showLinkDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '300px',
          }}>
            <input
              ref={linkInputRef}
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInsertLink()
                if (e.key === 'Escape') {
                  setShowLinkDialog(false)
                  setLinkText('')
                }
              }}
              placeholder="Enter link text..."
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                marginBottom: '12px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowLinkDialog(false)
                  setLinkText('')
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleInsertLink}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

**Step 2: Commit**

Run:
```bash
git add src/components/MarkdownToolbar.tsx
git commit -m "feat: add MarkdownToolbar component"
```

---

## Task 10: Update CodeMirrorEditor for Toolbar Integration

**Files:**
- Modify: `src/components/CodeMirrorEditor.tsx`

**Step 1: Expose view ref and add insert method**

Replace file content with:

```typescript
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { bracketMatching } from '@codemirror/bracket-matching'
import { highlightSelection } from '@codemirror/highlight-selection'
import { highlightSpecialChars } from '@codemirror/highlight-special-chars'
import { oneDark } from '@codemirror/theme-one-dark'

export interface CodeMirrorEditorRef {
  insertText: (text: { before: string; after: string } | string) => void
}

interface CodeMirrorEditorProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange?: (from: number, to: number) => void
}

const CodeMirrorEditor = forwardRef<CodeMirrorEditorRef, CodeMirrorEditorProps>(({
  content,
  onChange,
  onSelectionChange,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

  useImperativeHandle(ref, () => ({
    insertText: (text) => {
      if (!viewRef.current) return

      const view = viewRef.current
      const { from, to } = view.state.selection.main

      if (typeof text === 'string') {
        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
        })
      } else {
        const selectedText = view.state.doc.sliceString(from, to)
        view.dispatch({
          changes: { from, to, insert: text.before + selectedText + text.after },
          selection: { anchor: from + text.before.length + selectedText.length },
        })
      }

      onChange(view.state.doc.toString())
    },
  }))

  useEffect(() => {
    if (!containerRef.current) return

    const startState = EditorState.create({
      doc: content,
      extensions: [
        markdown({ codeLanguages: languages }),
        bracketMatching(),
        highlightSelection(),
        highlightSpecialChars(),
        isDarkMode ? oneDark : EditorView.theme({
          '&': { height: '100%', fontSize: '16px' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { padding: '20px' },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
          if (update.selectionSet && onSelectionChange) {
            const { from, to } = update.state.selection.main
            onSelectionChange(from, to)
          }
        }),
      ],
    })

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [isDarkMode])

  useEffect(() => {
    if (viewRef.current && content !== viewRef.current.state.doc.toString()) {
      const transaction = viewRef.current.state.update({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
      })
      viewRef.current.dispatch(transaction)
    }
  }, [content])

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
      }}
    />
  )
})

CodeMirrorEditor.displayName = 'CodeMirrorEditor'
export default CodeMirrorEditor
```

**Step 2: Commit**

Run:
```bash
git add src/components/CodeMirrorEditor.tsx
git commit -m "feat: add insertText method to CodeMirrorEditor for toolbar"
```

---

## Task 11: Update EditorContainer with Sidebar and Toolbar

**Files:**
- Modify: `src/components/EditorContainer.tsx`

**Step 1: Integrate sidebar and toolbar into layout**

Replace entire file content with:

```typescript
import React, { useRef } from 'react'
import { useDocumentStore, useEditorStore, useUIStore, useFileTreeStore } from '../store'
import Code { type CodeMirrorEditorRef } from './CodeMirrorEditor'
import FileExplorer from './FileExplorer'
import MarkdownToolbar from './MarkdownToolbar'
import { markdownTransformer } from '../utils/markdownTransformer'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
})

export default function EditorContainer() {
  const { content, setContent, saveToStack, setFilePath, setInitialContent } = useDocumentStore()
  const { setSelection, setCurrentBlockType } = useEditorStore()
  const { showSidebar, sidebarWidth, setSidebarWidth, showPreview, showEditor, sliderPosition, setSliderPosition } = useUIStore()
  const { setSelectedFile } = useFileTreeStore()
  const [isDraggingDivider, setIsDraggingDivider] = React.useState(false)
  const [isDraggingSidebar, setIsDraggingSidebar] = React.useState(false)
  const editorRef = useRef<CodeMirrorEditorRef>(null)

  const handleChange = (newContent: string) => {
    setContent(newContent)
    saveToStack()
  }

  const handleSelectionChange = (from: number, to: number) => {
    setSelection(from, to)
    const lines = content.split('\n')
    const currentLine = content.substring(0, from).split('\n').length - 1
    const lineText = lines[currentLine] || ''
    setCurrentBlockType(detectBlockType(lineText))
  }

  const detectBlockType = (line: string): string => {
    const trimmed = line.trim()
    if (trimmed.startsWith('# ')) return 'heading1'
    if (trimmed.startsWith('## ')) return 'heading2'
    if (trimmed.startsWith('### ')) return 'heading3'
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return 'bullet'
    if (trimmed.match(/^\d+\./)) return 'numbered'
    if (trimmed.startsWith('```')) return 'code'
    if (trimmed.startsWith('>')) return 'quote'
    return 'paragraph'
  }

  const handleFileSelect = async (path: string) => {
    try {
      const fileContent = await window.electronAPI.fileTree.readFile(path)
      setInitialContent(fileContent)
      setFilePath(path)
      setSelectedFile(path)
    } catch (error) {
      console.error('Error loading file:', error)
    }
  }

  const previewHtml = markdownTransformer.transform(content)
  const mermaidCode = markdownTransformer.extractMermaidCode(content)

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    setIsDraggingDivider(true)
    e.preventDefault()
  }

  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSidebar(true)
    e.preventDefault()
  }

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingDivider) {
        const container = document.querySelector('.editor-layout') as HTMLElement
        if (!container) return

        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = (x / rect.width) * 100

        if (percentage > 20 && percentage < 80) {
          setSliderPosition(percentage)
        }
      }

      if (isDraggingSidebar) {
        const sidebar = document.querySelector('.file-explorer') as HTMLElement
        if (!sidebar) return

        const rect = sidebar.getBoundingClientRect()
        const newWidth = e.clientX - rect.left
        if (newWidth >= 150 && newWidth <= 600) {
          setSidebarWidth(newWidth)
        }
      }
    }

    const handleMouseUp = () => {
      setIsDraggingDivider(false)
      setIsDraggingSidebar(false)
    }

    if (isDraggingDivider || isDraggingSidebar) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingDivider, isDraggingSidebar, setSliderPosition, setSidebarWidth])

  React.useEffect(() => {
    const renderMermaid = async () => {
      if (mermaidCode.length === 0) return

      await new Promise(resolve => setTimeout(resolve, 100))

      const previewContainer = document.querySelector('.markdown-preview')
      if (!previewContainer) return

      const mermaidDivs = previewContainer.querySelectorAll('.mermaid-diagram')

      for (let i = 0; i < mermaidDivs.length; i++) {
        const div = mermaidDivs[i] as HTMLElement
        if (i < mermaidCode.length && mermaidCode[i]) {
          const code = mermaidCode[i]

          try {
            const { svg, bindFunctions } = await mermaid.render(`mermaid-diagram-${i}`, code)
            div.innerHTML = svg
            bindFunctions?.(div)
          } catch (error) {
            console.error('Mermaid rendering error:', error)
            div.innerHTML = `<pre style="color: red; padding: 10px; border: 1px solid red;">Mermaid error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCode:\n${code}</pre>`
          }
        }
      }
    }

    renderMermaid()
  }, [mermaidCode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', height: '100%' }}>
        {showSidebar && (
          <>
            <div className="file-explorer" style={{ width: sidebarWidth, borderRight: '1px solid #e0e0e0' }}>
              <FileExplorer onFileSelect={handleFileSelect} />
            </div>
            <div
              style={{
                width: '8px',
                cursor: 'col-resize',
                backgroundColor: '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseDown={handleSidebarMouseDown}
            >
              <div style={{ width: '2px', height: '20px', backgroundColor: '#9e9e9e' }} />
            </div>
          </>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <MarkdownToolbar onInsertMarkdown={(text) => editorRef.current?.insertText(text)} />
          <div className="editor-layout" style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
            <div style={{ width: !showPreview ? '0%' : (!showEditor ? '100%' : `${sliderPosition}%`), overflow: 'hidden' }}>
              {showPreview && (
                <div
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '20px',
                    height: '100%',
                    overflow: 'auto',
                  }}
                  className="markdown-preview"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>
            {showPreview && showEditor && (
              <div
                style={{
                  width: '8px',
                  cursor: 'col-resize',
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: isDraggingDivider ? 'none' : 'background-color 0.2s',
                }}
                onMouseDown={handleDividerMouseDown}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#bdbdbd'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
              >
                <div style={{ width: '2px', height: '20px', backgroundColor: '#9e9e9e' }} />
              </div>
            )}
            <div style={{ width: !showPreview ? '100%' : (!showEditor ? '0%' : `${100 - sliderPosition}%`), overflow: 'hidden' }}>
              {showEditor && (
                <CodeMirrorEditor
                  ref={editorRef}
                  content={content}
                  onChange={handleChange}
                  onSelectionChange={handleSelectionChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

Run:
```bash
git add src/components/EditorContainer.tsx
git commit -m "feat: integrate file explorer sidebar and toolbar into EditorContainer"
```

---

## Task 12: Build and Test

**Files:**
- None (build and verify)

**Step 1: Build the project**

Run: `npm run build`

Expected: Successful build with no TypeScript errors

**Step 2: Run development mode**

Run: `npm run dev` (in one terminal)

Run: `npm run electron:dev` (in another terminal)

Expected: Application opens with file explorer sidebar, toolbar, and syntax highlighting

**Step 3: Manual verification**

1. File Explorer:
   - Click on folder to expand/collapse
   - Click on file to open in editor
   - Verify syntax highlighting is working

2. Toolbar:
   - Click Bold button: verify `**text**` inserted
   - Click H1 button: verify `# ` inserted
   - Click Table button: verify dialog opens
   - Click Show/Hide Preview/Editor buttons: verify toggles work

3. Syntax Highlighting:
   - Type Markdown: verify colors for headings, lists, code blocks
   - Type brackets: verify matching pairs highlighted
   - Select text: verify selection highlight visible

4. Resizable Dividers:
   - Drag sidebar divider: verify width changes
   - Drag preview divider: verify split changes

**Step 4: Commit final changes**

Run:
```bash
git commit -m "feat: complete file explorer, toolbar, and syntax highlighting implementation" --allow-empty
```

---

## Implementation Complete

All features have been implemented:
- File explorer sidebar with full file system access
- Markdown toolbar with formatting buttons
- Syntax highlighting with bracket matching
- Theme support based on system preferences
- Resizable dividers for sidebar and preview/editor split

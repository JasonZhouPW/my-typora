# Core Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a functional Electron-based Markdown editor with real-time seamless rendering, basic Markdown support, and file operations.

**Architecture:** Electron app with React frontend, CodeMirror 6 for editing, Markdown-IT for parsing, and Zustand for state management. Three-layer architecture: Renderer (React UI), Main Process (Electron), and File System Layer.

**Tech Stack:** Electron, React, TypeScript, CodeMirror 6, Markdown-IT, Zustand, Vite

---

## Task 1: Initialize Project Structure

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `electron/main.ts`
- Create: `src/main.tsx`
- Create: `index.html`

**Step 1: Write package.json**

```json
{
  "name": "typra",
  "version": "0.1.0",
  "description": "Typora-like Markdown editor",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "electron .",
    "electron:build": "npm run build && electron-builder"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@codemirror/view": "^6.23.0",
    "@codemirror/state": "^6.4.1",
    "@codemirror/basic-setup": "^6.0.0",
    "@codemirror/markdown": "^6.2.0",
    "@codemirror/language": "^6.10.0",
    "@codemirror/commands": "^6.3.0",
    "@codemirror/search": "^6.5.0",
    "@codemirror/autocomplete": "^6.12.0",
    "@codemirror/lint": "^6.4.0",
    "markdown-it": "^14.0.0",
    "markdown-it-table": "^3.0.0",
    "markdown-it-deflist": "^3.0.0",
    "markdown-it-footnote": "^4.0.0",
    "markdown-it-sub": "^2.0.0",
    "markdown-it-sup": "^2.0.0",
    "markdown-it-math": "^4.0.0",
    "markdown-it-mermaid": "^2.1.0",
    "katex": "^0.16.9",
    "mermaid": "^10.9.0",
    "zustand": "^4.4.7",
    "electron-store": "^8.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vite-plugin-electron": "^0.28.1",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1"
  }
}
```

**Step 2: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "electron"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 3: Write tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**Step 4: Write vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
    ]),
  ],
})
```

**Step 5: Write index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Typora</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 6: Write src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Step 7: Write src/App.tsx**

```typescript
import React from 'react'

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Typora-like Markdown Editor</h1>
      <p>Editor coming soon...</p>
    </div>
  )
}

export default App
```

**Step 8: Write electron/main.ts**

```typescript
import { app, BrowserWindow } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
```

**Step 9: Commit**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts index.html src/ electron/
git commit -m "feat: initialize project structure with Electron, React, and Vite"
```

---

## Task 2: Install Dependencies and Verify Build

**Step 1: Install dependencies**

Run: `npm install`

Expected: All packages installed successfully

**Step 2: Start dev server**

Run: `npm run dev` (in background)

Expected: Vite dev server starts on localhost:5173

**Step 3: Test Electron app**

Run: `npm run electron:dev`

Expected: Electron window opens with "Typora-like Markdown Editor" heading

**Step 4: Kill background processes and commit**

```bash
git add package-lock.json
git commit -m "chore: install and verify all dependencies"
```

---

## Task 3: Create Zustand State Store

**Files:**
- Create: `src/store/index.ts`
- Create: `src/store/documentStore.ts`
- Create: `src/store/uiStore.ts`
- Create: `src/store/editorStore.ts`

**Step 1: Write src/store/documentStore.ts**

```typescript
import { create } from 'zustand'

interface DocumentState {
  filePath: string | null
  content: string
  isModified: boolean
  lastSaved: number | null
  undoStack: string[]
  redoStack: string[]
  setContent: (content: string) => void
  setFilePath: (path: string | null) => void
  setModified: (modified: boolean) => void
  saveToStack: () => void
  undo: () => void
  redo: () => void
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  filePath: null,
  content: '',
  isModified: false,
  lastSaved: null,
  undoStack: [],
  redoStack: [],

  setContent: (content: string) => {
    set({ content, isModified: true })
  },

  setFilePath: (path: string | null) => {
    set({ filePath: path })
  },

  setModified: (modified: boolean) => {
    set({ isModified: modified })
  },

  saveToStack: () => {
    const { content, undoStack } = get()
    if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== content) {
      set({ undoStack: [...undoStack, content], redoStack: [] })
    }
  },

  undo: () => {
    const { undoStack, redoStack, content } = get()
    if (undoStack.length > 1) {
      const newUndoStack = undoStack.slice(0, -1)
      const newContent = newUndoStack[newUndoStack.length - 1]
      set({
        undoStack: newUndoStack,
        redoStack: [...redoStack, content],
        content: newContent,
        isModified: true,
      })
    }
  },

  redo: () => {
    const { undoStack, redoStack, content } = get()
    if (redoStack.length > 0) {
      const newRedoStack = redoStack.slice(0, -1)
      const newContent = newRedoStack[newRedoStack.length - 1]
      set({
        undoStack: [...undoStack, newContent],
        redoStack: newRedoStack,
        content: newContent,
        isModified: true,
      })
    }
  },
}))
```

**Step 2: Write src/store/uiStore.ts**

```typescript
import { create } from 'zustand'

interface UIState {
  theme: string
  darkMode: boolean
  viewMode: 'normal' | 'focus' | 'typewriter'
  showSidebar: boolean
  showTableOfContents: boolean
  setTheme: (theme: string) => void
  setDarkMode: (dark: boolean) => void
  setViewMode: (mode: 'normal' | 'focus' | 'typewriter') => void
  toggleSidebar: () => void
  toggleTableOfContents: () => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'default',
  darkMode: false,
  viewMode: 'normal',
  showSidebar: false,
  showTableOfContents: false,

  setTheme: (theme: string) => set({ theme }),
  setDarkMode: (dark: boolean) => set({ darkMode: dark }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
  toggleTableOfContents: () => set((state) => ({ showTableOfContents: !state.showTableOfContents })),
}))
```

**Step 3: Write src/store/editorStore.ts**

```typescript
import { create } from 'zustand'

interface EditorState {
  cursorPosition: number
  selectionStart: number
  selectionEnd: number
  currentBlockType: string
  setCursorPosition: (pos: number) => void
  setSelection: (start: number, end: number) => void
  setCurrentBlockType: (type: string) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  cursorPosition: 0,
  selectionStart: 0,
  selectionEnd: 0,
  currentBlockType: 'paragraph',

  setCursorPosition: (pos: number) => set({ cursorPosition: pos }),
  setSelection: (start: number, end: number) => set({ selectionStart: start, selectionEnd: end }),
  setCurrentBlockType: (type: string) => set({ currentBlockType: type }),
}))
```

**Step 4: Write src/store/index.ts**

```typescript
export { useDocumentStore } from './documentStore'
export { useUIStore } from './uiStore'
export { useEditorStore } from './editorStore'
```

**Step 5: Commit**

```bash
git add src/store/
git commit -m "feat: create Zustand state stores for document, UI, and editor"
```

---

## Task 4: Create Markdown Transformer

**Files:**
- Create: `src/utils/markdownTransformer.ts`

**Step 1: Write src/utils/markdownTransformer.ts**

```typescript
import MarkdownIt from 'markdown-it'
import markdownItTable from 'markdown-it-table'
import markdownItDeflist from 'markdown-it-deflist'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import markdownItMath from 'markdown-it-math'
import markdownItMermaid from 'markdown-it-mermaid'
import katex from 'katex'

export class MarkdownTransformer {
  private md: MarkdownIt

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    })

    // Configure extensions
    this.md.use(markdownItTable)
    this.md.use(markdownItDeflist)
    this.md.use(markdownItFootnote)
    this.md.use(markdownItSub)
    this.md.use(markdownItSup)

    // Math support
    this.md.use(markdownItMath, {
      katex,
      throwOnError: false,
    })

    // Mermaid support
    this.md.use(markdownItMermaid, {
      startOnLoad: true,
      theme: 'default',
    })
  }

  /**
   * Convert markdown to HTML
   */
  transform(markdown: string): string {
    return this.md.render(markdown)
  }

  /**
   * Parse markdown to tokens
   */
  parse(markdown: string) {
    return this.md.parse(markdown, {})
  }

  /**
   * Get plain text from markdown (strips formatting)
   */
  toPlainText(markdown: string): string {
    const html = this.md.render(markdown)
    return html.replace(/<[^>]*>/g, '')
  }
}

// Singleton instance
export const markdownTransformer = new MarkdownTransformer()
```

**Step 2: Commit**

```bash
git add src/utils/markdownTransformer.ts
git commit -m "feat: create Markdown transformer with full feature support"
```

---

## Task 5: Create CodeMirror Editor Component

**Files:**
- Create: `src/components/EditorContainer.tsx`
- Create: `src/components/CodeMirrorEditor.tsx`

**Step 1: Write src/components/CodeMirrorEditor.tsx**

```typescript
import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'

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

  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      doc: content,
      extensions: [
        basicSetup,
        markdown({ codeLanguages: languages }),
        EditorView.theme({
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
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  // Update content when prop changes
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

**Step 2: Write src/components/EditorContainer.tsx**

```typescript
import { useDocumentStore, useEditorStore } from '../store'
import CodeMirrorEditor from './CodeMirrorEditor'
import { markdownTransformer } from '../utils/markdownTransformer'

export default function EditorContainer() {
  const { content, setContent, saveToStack } = useDocumentStore()
  const { setSelection, setCurrentBlockType } = useEditorStore()

  const handleChange = (newContent: string) => {
    setContent(newContent)
    saveToStack()
  }

  const handleSelectionChange = (from: number, to: number) => {
    setSelection(from, to)
    // Determine current block type based on cursor position
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

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, marginRight: '10px' }}>
        <CodeMirrorEditor
          content={content}
          onChange={handleChange}
          onSelectionChange={handleSelectionChange}
        />
      </div>
    </div>
  )
}
```

**Step 3: Update src/App.tsx**

```typescript
import React from 'react'
import EditorContainer from './components/EditorContainer'
import { useDocumentStore } from './store'

function App() {
  const { content, setContentSetInitialContent } = useDocumentStore()

  // Set initial content
  React.useEffect(() => {
    setContentSetInitialContent('# Welcome to Typora\n\nStart typing your Markdown here...\n\n## Features\n\n- **Bold** and *italic* text\n- `Code` blocks\n- [Links](https://example.com)\n\nAnd more to come!')
  }, [])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '10px 20px', borderBottom: '1px solid #e0e0e0' }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>Typora Editor</h1>
      </header>
      <div style={{ flex: 1, padding: '20px' }}>
        <EditorContainer />
      </div>
    </div>
  )
}

export default App
```

**Step 4: Fix documentStore to add setInitialContent**

Edit: `src/store/documentStore.ts`

Replace the interface with:

```typescript
interface DocumentState {
  filePath: string | null
  content: string
  isModified: boolean
  lastSaved: number | null
  undoStack: string[]
  redoStack: string[]
  setContent: (content: string) => void
  setFilePath: (path: string | null) => void
  setModified: (modified: boolean) => void
  setInitialContent: (content: string) => void
  saveToStack: () => void
  undo: () => void
  redo: () => void
}
```

Add to the store methods:

```typescript
setInitialContent: (content: string) => {
  set({ content, undoStack: [content] })
},
```

**Step 5: Commit**

```bash
git add src/components/ src/App.tsx
git commit -m "feat: create CodeMirror editor component with state integration"
```

---

## Task 6: Implement File Operations

**Files:**
- Create: `electron/fileOperations.ts`
- Create: `electron/preload.ts`
- Create: `src/utils/fileOperations.ts`

**Step 1: Write electron/fileOperations.ts**

```typescript
import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs/promises'
import path from 'path'

export function registerFileHandlers() {
  // Handle open file dialog
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

  // Handle save file dialog
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

  // Handle save file (overwrite)
  ipcMain.handle('file:save', async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8')
    return true
  })

  // Watch file for external changes
  const watchers = new Map<string, fs.FileWatch>()

  ipcMain.handle('file:watch', async (_event, filePath: string) => {
    if (watchers.has(filePath)) return

    try {
      const watcher = fs.watch(filePath, async (eventType) => {
        if (eventType === 'change') {
          const window = BrowserWindow.getFocusedWindow()
          if (window) {
            const newContent = await fs.readFile(filePath, 'utf-8')
            window.webContents.send('file:changed', newContent)
          }
        }
      })
      watchers.set(filePath, watcher)
    } catch (error) {
      console.error('Failed to watch file:', error)
    }
  })

  ipcMain.handle('file:unwatch', async (_event, filePath: string) => {
    const watcher = watchers.get(filePath)
    if (watcher) {
      await watcher.close()
      watchers.delete(filePath)
    }
  })
}
```

**Step 2: Write electron/preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    saveAs: (content: string) => ipcRenderer.invoke('file:save-as', content),
    save: (filePath: string, content: string) => ipcRenderer.invoke('file:save', filePath, content),
    watch: (filePath: string) => ipcRenderer.invoke('file:watch', filePath),
    unwatch: (filePath: string) => ipcRenderer.invoke('file:unwatch', filePath),
    onFileChanged: (callback: (content: string) => void) => {
      ipcRenderer.on('file:changed', (_event, content) => callback(content))
    },
  },
})

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      file: {
        open: () => Promise<{ path: string; content: string } | null>
        saveAs: (content: string) => Promise<string | null>
        save: (filePath: string, content: string) => Promise<boolean>
        watch: (filePath: string) => Promise<void>
        unwatch: (filePath: string) => Promise<void>
        onFileChanged: (callback: (content: string) => void) => void
      }
    }
  }
}
```

**Step 3: Update electron/main.ts**

Add import and register handlers:

```typescript
import { registerFileHandlers } from './fileOperations'

// After app.on('ready', createWindow)
registerFileHandlers()
```

**Step 4: Write src/utils/fileOperations.ts**

```typescript
export const fileOperations = {
  async openFile(): Promise<{ path: string; content: string } | null> {
    return await window.electronAPI.file.open()
  },

  async saveAsFile(content: string): Promise<string | null> {
    return await window.electronAPI.file.saveAs(content)
  },

  async saveFile(filePath: string, content: string): Promise<boolean> {
    return await window.electronAPI.file.save(filePath, content)
  },

  async watchFile(filePath: string): Promise<void> {
    await window.electronAPI.file.watch(filePath)
  },

  async unwatchFile(filePath: string): Promise<void> {
    await window.electronAPI.file.unwatch(filePath)
  },

  onFileChanged(callback: (content: string) => void): void {
    window.electronAPI.file.onFileChanged(callback)
  },
}
```

**Step 5: Update src/store/documentStore.ts to add file watching**

Add methods:

```typescript
watchFile: (filePath: string) => void,
unwatchFile: () => void,
```

Add to store:

```typescript
watchFile: (filePath: string) => {
  const { unwatchFile } = get()
  unwatchFile()
  import('../utils/fileOperations').then(({ fileOperations }) => {
    fileOperations.watchFile(filePath)
    fileOperations.onFileChanged((newContent) => {
      set({ content: newContent })
    })
  })
},

unwatchFile: () => {
  const { filePath } = get()
  if (filePath) {
    import('electron').then(() => {
      import('../utils/fileOperations').then(({ fileOperations }) => {
        fileOperations.unwatchFile(filePath)
      })
    })
  }
},
```

**Step 6: Commit**

```bash
git add electron/ src/utils/fileOperations.ts src/store/documentStore.ts
git commit -m "feat: implement file operations (open, save, watch) with IPC"
```

---

## Task 7: Add Menu Bar and Keyboard Shortcuts

**Files:**
- Create: `electron/menu.ts`
- Update: `src/App.tsx`

**Step 1: Write electron/menu.ts**

```typescript
import { Menu, app, dialog, BrowserWindow } from 'electron'
import fs from 'fs/promises'

export function createMenu() {
  const template: Electron.MenuItemConstructorOption[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send('file:new')
            }
          },
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send('file:open-request')
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send('file:save-request')
            }
          },
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send('file:save-as-request')
            }
          },
        },
        { type: 'separator' },
        {
          label: process.platform === 'darwin' ? 'Quit Typora' : 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
```

**Step 2: Update electron/main.ts**

Import and create menu:

```typescript
import { createMenu } from './menu'

// After app.on('ready', createWindow)
createMenu()
```

**Step 3: Update src/App.tsx to handle menu events**

```typescript
import React from 'react'
import EditorContainer from './components/EditorContainer'
import { useDocumentStore, useUIStore } from './store'
import { fileOperations } from './utils/fileOperations'

function App() {
  const { content, setContent, setInitialContent, filePath, setFilePath, setModified } = useDocumentStore()
  const { toggleSidebar } = useUIStore()

  // Set initial content
  React.useEffect(() => {
    setInitialContent('# Welcome to Typora\n\nStart typing your Markdown here...\n\n## Features\n\n- **Bold** and *italic* text\n- `Code` blocks\n- [Links](https://example.com)\n\nAnd more to come!')
  }, [])

  // Handle menu events
  React.useEffect(() => {
    const handleNew = () => {
      setFilePath(null)
      setContent('')
      setModified(false)
    }

    const handleOpenRequest = async () => {
      const result = await fileOperations.openFile()
      if (result) {
        setFilePath(result.path)
        setContent(result.content)
        setModified(false)
      }
    }

    const handleSaveRequest = async () => {
      if (filePath) {
        await fileOperations.saveFile(filePath, content)
        setModified(false)
      } else {
        await handleSaveAsRequest()
      }
    }

    const handleSaveAsRequest = async () => {
      const newFilePath = await fileOperations.saveAsFile(content)
      if (newFilePath) {
        setFilePath(newFilePath)
        setModified(false)
      }
    }

    const listener = (_event: Electron.IpcRendererEvent, channel: string) => {
      switch (channel) {
        case 'file:new':
          handleNew()
          break
        case 'file:open-request':
          handleOpenRequest()
          break
        case 'file:save-request':
          handleSaveRequest()
          break
        case 'file:save-as-request':
          handleSaveAsRequest()
          break
      }
    }

    window.electron?.on('menu-action', listener)

    return () => {
      window.electron?.removeListener('menu-action', listener)
    }
  }, [content, filePath])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '18px' }}>Typora Editor</h1>
        <div>
          <button onClick={toggleSidebar} style={{ marginRight: '10px' }}>
            Sidebar
          </button>
        </div>
      </header>
      <div style={{ flex: 1, padding: '20px' }}>
        <EditorContainer />
      </div>
    </div>
  )
}

export default App
```

**Step 4: Commit**

```bash
git add electron/menu.ts src/App.tsx
git commit -m "feat: add menu bar and keyboard shortcuts for file operations"
```

---

## Task 8: Add Basic Styling

**Files:**
- Create: `src/styles/global.css`
- Update: `src/main.tsx`

**Step 1: Write src/styles/global.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #fff;
}

#root {
  height: 100vh;
}

button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #f5f5f5;
}

/* CodeMirror styles */
.cm-editor {
  height: 100%;
  font-size: 16px;
}

.cm-content {
  padding: 20px;
  font-family: 'Monaco', 'Courier New', monospace;
}

/* Markdown preview styles */
.markdown-preview {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.markdown-preview h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.3em;
}

.markdown-preview preview h2 {
  font-size: 1.5em;
  margin-bottom: 0.5em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

.markdown-preview h3 {
  font-size: 1.25em;
  margin-bottom: 0.5em;
}

.markdown-preview p {
  margin-bottom: 1em;
}

.markdown-preview code {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-preview pre {
  background: #f4f4f4;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 1em;
}

.markdown-preview pre code {
  background: none;
  padding: 0;
}

.markdown-preview blockquote {
  border-left: 4px solid #ddd;
  padding-left: 1em;
  margin-left: 0;
  color: #666;
  margin-bottom: 1em;
}

.markdown-preview ul,
.markdown-preview ol {
  margin-left: 2em;
  margin-bottom: 1em;
}

.markdown-preview li {
  margin-bottom: 0.5em;
}

.markdown-preview a {
  color: #0066cc;
  text-decoration: underline;
}

.markdown-preview img {
  max-width: 100%;
  height: auto;
  margin: 1em 0;
}

.markdown-preview table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

.markdown-preview th,
.markdown-preview td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.markdown-preview th {
  background: #f4f4f4;
  font-weight: bold;
}
```

**Step 2: Update src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

ReactDOM.create.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Step 3: Commit**

```bash
git add src/styles/
git commit -m "style: add basic global styles and Markdown preview styles"
```

---

## Task 9: Add Preview Pane Toggle

**Files:**
- Update: `src/components/EditorContainer.tsx`
- Update: `src/store/uiStore.ts`

**Step 1: Update src/store/uiStore.ts**

Add to interface:

```typescript
showPreview: boolean
togglePreview: () => void
```

Add to store:

```typescript
showPreview: true,

togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
```

**Step 2: Update src/components/EditorContainer.tsx**

```typescript
import { useDocumentStore, useEditorStore, useUIStore } from '../store'
import CodeMirrorEditor from './CodeMirrorEditor'
import { markdownTransformer } from '../utils/markdownTransformer'
import React from 'react'

export default function EditorContainer() {
  const { content, setContent, saveToStack } = useDocumentStore()
  const { setSelection, setCurrentBlockType } = useEditorStore()
  const { showPreview, togglePreview } = useUIStore()

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

  const previewHtml = markdownTransformer.transform(content)

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px', padding: '0 20px' }}>
        <button onClick={togglePreview}>
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>
      <div style={{ display: 'flex', flex: 1, height: '100%' }}>
        <div style={{ flex: 1, marginRight: showPreview ? '10px' : '0' }}>
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
        <div style={{ flex: 1 }}>
          <CodeMirrorEditor
            content={content}
            onChange={handleChange}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/EditorContainer.tsx src/store/uiStore.ts
git commit -m "feat: add preview pane toggle with live Markdown rendering"
```

---

## Task 10: Test Core Functionality

**Step 1: Start development servers**

Run: `npm run dev` (background)
Run: `npm run electron:dev`

Expected: Electron window opens with editor and preview pane

**Step 2: Test file operations**

- Click File > Open, select a Markdown file
- Expected: File content loads in editor
- Type some text
- Expected: Changes appear in preview pane
- Click File > Save As
- Expected: File saves successfully

**Step 3: Test Markdown rendering**

- Type Markdown content with various features:
  ```markdown
  # Heading 1
  ## Heading 2

  **Bold** and *italic* text

  `inline code`

  ```
  code block
  ```

  - Item 1
  - Item 2

  [Link](https://example.com)
  ```

Expected: All elements render correctly in preview pane

**Step 4: Test keyboard shortcuts**

- Press Cmd/Ctrl+S
- Expected: Save dialog or save action triggers

**Step 5: Commit**

```bash
git commit --allow-empty -m "test: verify core functionality works"
```

---

## Task 11: Add Auto-save Feature

**Files:**
- Update: `src/App.tsx`
- Update: `src/store/documentStore.ts`

**Step 1: Update src/store/documentStore.ts**

Add to interface:

```typescript
autoSaveInterval: NodeJS.Timeout | null
startAutoSave: () => void
stopAutoSave: () => void
```

Add to store:

```typescript
autoSaveInterval: null,

startAutoSave: () => {
  const { filePath, content, isModified, autoSaveInterval } = get()
  if (!filePath || !isModified) return

  // Clear existing interval
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
  }

  // Set new interval (30 seconds)
  const interval = setInterval(async () => {
    const state = get()
    if (state.filePath && state.isModified) {
      import('../utils/fileOperations').then(({ fileOperations }) => {
        fileOperations.saveFile(state.filePath!, state.content)
        state.setModified(false)
      })
    }
  }, 30000)

  set({ autoSaveInterval: interval })
},

stopAutoSave: () => {
  const { autoSaveInterval } = get()
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
    set({ autoSaveInterval: null })
  }
},
```

**Step 2: Update src/App.tsx**

In the useEffect that handles file operations, add auto-save:

```typescript
const handleSaveRequest = async () => {
  if (filePath) {
    await fileOperations.saveFile(filePath, content)
    setModified(false)
  } else {
    await handleSaveAsRequest()
  }
  startAutoSave() // Start auto-save after saving
}
```

Add cleanup on unmount:

```typescript
React.useEffect(() => {
  // ... existing code ...

  return () => {
    window.electron?.removeListener('menu-action', listener)
    stopAutoSave() // Stop auto-save on unmount
  }
}, [content, filePath])
```

**Step 3: Commit**

```bash
git add src/App.tsx src/store/documentStore.ts
git commit -m "feat: add auto-save functionality (every 30 seconds)"
```

---

## Task 12: Add Undo/Redo Support

**Files:**
- Update: `src/App.tsx`

**Step 1: Update src/App.tsx**

Add keyboard event listener:

```typescript
React.useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
      if (event.shiftKey) {
        // Cmd/Ctrl+Shift+Z = Redo
        redo()
      } else {
        // Cmd/Ctrl+Z = Undo
        undo()
      }
      event.preventDefault()
    }
  }

  window.addEventListener('keydown', handleKeyDown)

  return () => {
    window.removeEventListener('keydown', handleKeyDown)
  }
}, [])
```

**Step 2: Test undo/redo**

- Type some text
- Press Cmd/Ctrl+Z
- Expected: Text changes revert
- Press Cmd/Ctrl+Shift+Z
- Expected: Changes are reapplied

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add undo/redo keyboard shortcuts"
```

---

## Task 13: Add Window State Persistence

**Files:**
- Update: `electron/main.ts`
- Create: `electron/windowState.ts`

**Step 1: Write electron/windowState.ts**

```typescript
import { app, BrowserWindow, screen } from 'electron'
import electronStore from 'electron-store'

const store = new electronStore()

interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
}

export function getWindowState(): WindowState {
  const state = store.get('windowState') as WindowState | undefined

  if (state) {
    // Check if the saved position is still within the screen bounds
    const { width, height, x, y } = state
    const { bounds } = screen.getPrimaryDisplay()

    if (x && y && x < bounds.width && y < bounds.height) {
      return state
    }
  }

  // Default state
  return {
    width: 1200,
    height: 800,
  }
}

export function saveWindowState(window: BrowserWindow) {
  const [width, height] = window.getSize()
  const [x, y] = window.getPosition()

  store.set('windowState', { width, height, x, y })
}

export function trackWindowState(window: BrowserWindow) {
  window.on('resized', () => saveWindowState(window))
  window.on('moved', () => saveWindowState(window))
}
```

**Step 2: Update electron/main.ts**

Import and use window state:

```typescript
import { getWindowState, trackWindowState } from './windowState'

function createWindow() {
  const state = getWindowState()

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  trackWindowState(mainWindow)

  // ... rest of the code
}
```

**Step 3: Commit**

```bash
git add electron/
git commit -m "feat: add window state persistence on resize/move"
```

---

## Task 14: Final Verification

**Step 1: Build production version**

Run: `npm run build`

Expected: Build completes without errors

**Step 2: Test production build**

Run: `npm run electron:dev`

Expected: App runs successfully with all features working

**Step 3: Create comprehensive test checklist**

Verify:
- [ ] Editor loads and accepts input
- [ ] Preview pane updates in real-time
- [ ] Markdown renders correctly (headings, lists, code, links, bold, italic)
- [ ] File > Open works
- [ ] File > Save As works
- [ ] File > Save works
- [ ] Auto-save triggers every 30 seconds
- [ ] Undo/Redo works with Cmd/Ctrl+Z
- [ ] Window position/size persists across restarts
- [ ] Menu shortcuts work
- [ ] Sidebar toggle works
- [ ] Preview toggle works

**Step 4: Commit**

```bash
git commit --allow-empty -m "test: final verification of Phase 1 features"
```

---

## Task 15: Update Package.json with Better Scripts

**Files:**
- Update: `package.json`

**Step 1: Update scripts section**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "concurrently \"vite\" \"electron .\" --kill-others",
    "electron:build": "npm run build && electron-builder",
    "electron:pack": "npm run build && electron-builder --dir",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
  }
}
```

**Step 2: Add devDependencies**

```json
{
  "devDependencies": {
    "concurrently": "^8.2.2",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0"
  }
}
```

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: improve build scripts and add linting/formatting tools"
```

---

## Task 16: Create README

**Files:**
- Create: `README.md`

**Step 1: Write README.md**

```markdown
# Typora-like Markdown Editor

A modern, cross-platform Markdown editor with real-time WYSIWYG-like preview.

## Features

- ✅ Real-time Markdown preview
- ✅ Seamless editing with CodeMirror 6
- ✅ Full Markdown support (CommonMark + GFM)
- ✅ File operations (open, save, save as)
- ✅ Auto-save (every 30 seconds)
- ✅ Undo/Redo support
- ✅ Window state persistence
- ✅ Keyboard shortcuts
- ✅ Preview pane toggle

## Tech Stack

- **Electron**: Cross-platform desktop framework
- **React**: UI framework
- **CodeMirror 6**: Editor component
- **Markdown-IT**: Markdown parser
- **Zustand**: State management
- **Vite**: Build tool

## Getting Started

### Install Dependencies

\`\`\`bash
npm install
\`\`\`

### Development Mode

\`\`\`bash
npm run electron:dev
\`\`\`

### Build for Production

\`\`\`bash
npm run build
npm run electron:pack
\`\`\`

## Keyboard Shortcuts

- `Cmd/Ctrl+N`: New file
- `Cmd/Ctrl+O`: Open file
- `Cmd/Ctrl+S`: Save file
- `Cmd/Ctrl+Shift+S`: Save As
- `Cmd/Ctrl+Z`: Undo
- `Cmd/Ctrl+Shift+Z`: Redo

## Roadmap

### Phase 2: Advanced Features
- [ ] Table editor with in-place editing
- [ ] Mermaid diagram support
- [ ] Math formula rendering (KaTeX)
- [ ] Image handling (paste, drag & drop)
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

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README"
```

---

## Completion

Phase 1 implementation complete! The editor now has:

✅ Core Electron app with React
✅ CodeMirror 6 integration
✅ Real-time Markdown preview
✅ File operations (open, save, save as)
✅ Zustand state management
✅ Auto-save functionality
✅ Undo/Redo support
✅ Window state persistence
✅ Menu bar with keyboard shortcuts
✅ Basic styling

**Next Steps:**

1. Review and test all features
2. Proceed to Phase 2 for advanced features (tables, Mermaid, math, images, themes)
3. Or create additional implementation plans for specific features

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
  setInitialContent: (content: string) => void
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

  setInitialContent: (content: string) => {
    set({ content, undoStack: [content] })
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

import { create } from 'zustand'

const RECENT_FILES_KEY = 'typra-recent-files'
const MAX_RECENT_FILES = 10

export interface Tab {
  id: string
  filePath: string | null
  content: string
  isModified: boolean
  lastSaved: number | null
  undoStack: string[]
  redoStack: string[]
}

interface DocumentState {
  tabs: Tab[]
  activeTabId: string | null
  recentFiles: string[]
  // Tab management actions
  addTab: (tab: Partial<Omit<Tab, 'id' | 'undoStack' | 'redoStack'>>) => string
  closeTab: (tabId: string) => void
  switchTab: (tabId: string) => void
  reorderTabs: (newTabs: Tab[]) => void
  updateActiveTab: (updates: Partial<Omit<Tab, 'id'>>) => void
  setActiveTabContent: (content: string) => void
  setActiveTabFilePath: (path: string | null) => void
  saveActiveTabToStack: () => void
  undo: () => void
  redo: () => void
  // Helper to get active tab
  getActiveTab: () => Tab | undefined
  // Recent files actions
  addRecentFile: (filePath: string) => void
  clearRecentFiles: () => void
}

function createTab(content: string = '', filePath: string | null = null, isModified: boolean = false): Tab {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    filePath,
    content,
    isModified,
    lastSaved: null,
    undoStack: [content],
    redoStack: [],
  }
}

// Helper to load recent files from localStorage
function loadRecentFiles(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_FILES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Helper to save recent files to localStorage
function saveRecentFiles(files: string[]) {
  try {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(files))
  } catch {
    // Ignore storage errors
  }
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  recentFiles: loadRecentFiles(),

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find(tab => tab.id === activeTabId)
  },

  addTab: (tabData) => {
    const newTab = createTab(tabData.content, tabData.filePath)
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }))
    return newTab.id
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get()
    const tabIndex = tabs.findIndex(tab => tab.id === tabId)
    if (tabIndex === -1) return

    const newTabs = tabs.filter(tab => tab.id !== tabId)

    // If closing active tab, switch to another tab
    let newActiveTabId = activeTabId
    if (tabId === activeTabId) {
      if (newTabs.length > 0) {
        // Switch to previous tab, or next tab if closing the only tab
        const newIndex = Math.min(tabIndex, newTabs.length - 1)
        newActiveTabId = newTabs[newIndex].id
      } else {
        newActiveTabId = null
      }
    }

    set({ tabs: newTabs, activeTabId: newActiveTabId })
  },

  switchTab: (tabId) => {
    set({ activeTabId: tabId })
  },

  reorderTabs: (newTabs) => {
    set({ tabs: newTabs })
  },

  updateActiveTab: (updates) => {
    const { tabs, activeTabId } = get()
    if (!activeTabId) return

    set({
      tabs: tabs.map(tab =>
        tab.id === activeTabId ? { ...tab, ...updates } : tab
      ),
    })
  },

  setActiveTabContent: (content: string) => {
    const { tabs, activeTabId } = get()
    if (!activeTabId) return

    set({
      tabs: tabs.map(tab =>
        tab.id === activeTabId ? { ...tab, content, isModified: true } : tab
      ),
    })
  },

  setActiveTabFilePath: (path: string | null) => {
    const { tabs, activeTabId } = get()
    if (!activeTabId) return

    set({
      tabs: tabs.map(tab =>
        tab.id === activeTabId ? { ...tab, filePath: path } : tab
      ),
    })
  },

  saveActiveTabToStack: () => {
    const { tabs, activeTabId } = get()
    if (!activeTabId) return

    const activeTab = tabs.find(tab => tab.id === activeTabId)
    if (!activeTab) return

    const { content, undoStack } = activeTab
    if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== content) {
      set({
        tabs: tabs.map(tab =>
          tab.id === activeTabId
            ? { ...tab, undoStack: [...undoStack, content], redoStack: [] }
            : tab
        ),
      })
    }
  },

  undo: () => {
    const { tabs, activeTabId } = get()
    if (!activeTabId) return

    const activeTab = tabs.find(tab => tab.id === activeTabId)
    if (!activeTab || activeTab.undoStack.length <= 1) return

    const newUndoStack = activeTab.undoStack.slice(0, -1)
    const newContent = newUndoStack[newUndoStack.length - 1]

    set({
      tabs: tabs.map(tab =>
        tab.id === activeTabId
          ? {
              ...tab,
              undoStack: newUndoStack,
              redoStack: [...tab.redoStack, tab.content],
              content: newContent,
              isModified: true,
            }
          : tab
      ),
    })
  },

  redo: () => {
    const { tabs, activeTabId } = get()
    if (!activeTabId) return

    const activeTab = tabs.find(tab => tab.id === activeTabId)
    if (!activeTab || activeTab.redoStack.length === 0) return

    const newRedoStack = activeTab.redoStack.slice(0, -1)
    const newContent = newRedoStack[newRedoStack.length - 1]

    set({
      tabs: tabs.map(tab =>
        tab.id === activeTabId
          ? {
              ...tab,
              undoStack: [...tab.undoStack, newContent],
              redoStack: newRedoStack,
              content: newContent,
              isModified: true,
            }
          : tab
      ),
    })
  },

  addRecentFile: (filePath: string) => {
    const { recentFiles } = get()
    // Remove if already exists
    const filtered = recentFiles.filter(f => f !== filePath)
    // Add to front
    const newRecent = [filePath, ...filtered].slice(0, MAX_RECENT_FILES)
    saveRecentFiles(newRecent)
    set({ recentFiles: newRecent })
  },

  clearRecentFiles: () => {
    saveRecentFiles([])
    set({ recentFiles: [] })
  },
}))

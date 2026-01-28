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

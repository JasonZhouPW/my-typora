import { create } from 'zustand'

export interface TreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: TreeNode[]
  isExpanded?: boolean
}

interface FileTreeState {
  tree: TreeNode[]
  selectedPath: string | null
  rootPath: string | null
  setTree: (tree: TreeNode[]) => void
  setSelectedPath: (path: string | null) => void
  setRootPath: (path: string | null) => void
  toggleNode: (path: string) => void
  updateNode: (path: string, updates: Partial<TreeNode>) => void
  addNode: (parentPath: string, node: TreeNode) => void
  removeNode: (path: string) => void
}

export const useFileTreeStore = create<FileTreeState>((set) => ({
  tree: [],
  selectedPath: null,
  rootPath: null,

  setTree: (tree: TreeNode[]) => {
    set({ tree })
  },

  setSelectedPath: (path: string | null) => {
    set({ selectedPath: path })
  },

  setRootPath: (path: string | null) => {
    set({ rootPath: path })
  },

  toggleNode: (path: string) => {
    const toggleNodeRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((node) => {
        if (node.path === path) {
          return { ...node, isExpanded: !node.isExpanded }
        }
        if (node.children) {
          return { ...node, children: toggleNodeRecursive(node.children) }
        }
        return node
      })
    }

    set((state) => ({ tree: toggleNodeRecursive(state.tree) }))
  },

  updateNode: (path: string, updates: Partial<TreeNode>) => {
    const updateNodeRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((node) => {
        if (node.path === path) {
          return { ...node, ...updates }
        }
        if (node.children) {
          return { ...node, children: updateNodeRecursive(node.children) }
        }
        return node
      })
    }

    set((state) => ({ tree: updateNodeRecursive(state.tree) }))
  },

  addNode: (parentPath: string, node: TreeNode) => {
    const addNodeRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((currentNode) => {
        if (currentNode.path === parentPath && currentNode.type === 'folder') {
          return {
            ...currentNode,
            children: [...(currentNode.children || []), node],
            isExpanded: true,
          }
        }
        if (currentNode.children) {
          return { ...currentNode, children: addNodeRecursive(currentNode.children) }
        }
        return currentNode
      })
    }

    set((state) => ({ tree: addNodeRecursive(state.tree) }))
  },

  removeNode: (path: string) => {
    const removeNodeRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .filter((node) => node.path !== path)
        .map((node) => ({
          ...node,
          children: node.children ? removeNodeRecursive(node.children) : undefined,
        }))
    }

    set((state) => ({
      tree: removeNodeRecursive(state.tree),
      selectedPath: state.selectedPath === path ? null : state.selectedPath,
    }))
  },
}))

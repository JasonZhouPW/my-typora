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

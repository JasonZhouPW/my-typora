import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    saveAs: (content: string) => ipcRenderer.invoke('file:save-as', content),
    save: (filePath: string, content: string) => ipcRenderer.invoke('file:save', filePath, content),
    readDir: (dirPath?: string) => ipcRenderer.invoke('file:read-dir', dirPath),
    read: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
    create: (dirPath: string, fileName: string) => ipcRenderer.invoke('file:create', dirPath, fileName),
    rename: (oldPath: string, newName: string) => ipcRenderer.invoke('file:rename', oldPath, newName),
    delete: (itemPath: string, isDirectory: boolean) => ipcRenderer.invoke('file:delete', itemPath, isDirectory).then(res => res as { success: boolean; error?: string }),
    getStats: (dirPath?: string) => ipcRenderer.invoke('file:get-stats', dirPath),
    consumeOpenFiles: () => ipcRenderer.invoke('file:consume-open-files'),
  },
  export: {
    pdf: (payload: { markdown: string; html: string; sourceFilePath?: string | null }) => ipcRenderer.invoke('export:pdf', payload),
    docx: (payload: { markdown: string; html: string; sourceFilePath?: string | null }) => ipcRenderer.invoke('export:docx', payload),
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
        readDir: (dirPath?: string) => Promise<Array<{ name: string; path: string; type: 'folder' | 'file'; isDirectory: boolean }>>
        read: (filePath: string) => Promise<{ path: string; content: string } | null>
        create: (dirPath: string, fileName: string) => Promise<{ path: string; name: string } | null>
        rename: (oldPath: string, newName: string) => Promise<{ success: boolean; newPath?: string; error?: string }>
        delete: (itemPath: string, isDirectory: boolean) => Promise<{ success: boolean; error?: string }>
        getStats: (dirPath?: string) => Promise<Array<{ name: string; path: string; type: 'folder' | 'file'; isDirectory: boolean; mtime: number; birthtime: number }>>
        consumeOpenFiles: () => Promise<string[]>
      }
      export: {
        pdf: (payload: { markdown: string; html: string; sourceFilePath?: string | null }) => Promise<{ success: boolean; filePath?: string; error?: string }>
        docx: (payload: { markdown: string; html: string; sourceFilePath?: string | null }) => Promise<{ success: boolean; filePath?: string; error?: string }>
      }
      on: (channel: string, listener: (...args: any[]) => void) => void
      removeListener: (channel: string, listener: (...args: any[]) => void) => void
    }
  }
}

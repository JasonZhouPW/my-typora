import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    saveAs: (content: string) => ipcRenderer.invoke('file:save-as', content),
    save: (filePath: string, content: string) => ipcRenderer.invoke('file:save', filePath, content),
    readDir: (dirPath?: string) => ipcRenderer.invoke('file:read-dir', dirPath),
    read: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
    create: (dirPath: string, fileName: string) => ipcRenderer.invoke('file:create', dirPath, fileName),
    delete: (itemPath: string, isDirectory: boolean) => ipcRenderer.invoke('file:delete', itemPath, isDirectory),
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
        delete: (itemPath: string, isDirectory: boolean) => Promise<boolean>
      }
      on: (channel: string, listener: (...args: any[]) => void) => void
      removeListener: (channel: string, listener: (...args: any[]) => void) => void
    }
  }
}

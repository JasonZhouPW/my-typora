import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    saveAs: (content: string) => ipcRenderer.invoke('file:save-as', content),
    save: (filePath: string, content: string) => ipcRenderer.invoke('file:save', filePath, content),
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
      on: (channel: string, listener: (...args: any[]) => void) => void
      removeListener: (channel: string, listener: (...args: any[]) => void) => void
    }
  }
}

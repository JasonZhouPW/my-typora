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

  async readDir(dirPath?: string): Promise<Array<{ name: string; path: string; type: 'folder' | 'file'; isDirectory: boolean }>> {
    return await window.electronAPI.file.readDir(dirPath)
  },

  async readFile(filePath: string): Promise<{ path: string; content: string } | null> {
    return await window.electronAPI.file.read(filePath)
  },

  async createFile(dirPath: string, fileName: string): Promise<{ path: string; name: string } | null> {
    return await window.electronAPI.file.create(dirPath, fileName)
  },

  async renameFile(oldPath: string, newName: string): Promise<{ success: boolean; newPath?: string; error?: string }> {
    return await window.electronAPI.file.rename(oldPath, newName)
  },

  async deleteFile(itemPath: string, isDirectory: boolean): Promise<{ success: boolean; error?: string }> {
    return await window.electronAPI.file.delete(itemPath, isDirectory)
  },

  async getStatsWithTimes(dirPath?: string): Promise<Array<{ name: string; path: string; type: 'folder' | 'file'; isDirectory: boolean; mtime: number; birthtime: number }>> {
    return await window.electronAPI.file.getStats(dirPath)
  },

  async exportPdf(payload: { markdown: string; html: string; sourceFilePath?: string | null }): Promise<{ success: boolean; filePath?: string; error?: string }> {
    return await window.electronAPI.export.pdf(payload)
  },

  async exportDocx(payload: { markdown: string; html: string; sourceFilePath?: string | null }): Promise<{ success: boolean; filePath?: string; error?: string }> {
    return await window.electronAPI.export.docx(payload)
  },
}

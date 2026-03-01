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

  async deleteFile(itemPath: string, isDirectory: boolean): Promise<{ success: boolean; error?: string }> {
    return await window.electronAPI.file.delete(itemPath, isDirectory)
  },
}

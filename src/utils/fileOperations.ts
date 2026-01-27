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
}

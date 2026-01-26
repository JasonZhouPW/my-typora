import { ipcMain, dialog } from 'electron'
import fs from 'fs/promises'

export function registerFileHandlers() {
  ipcMain.handle('file:open', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown', 'txt'] }],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    const content = await fs.readFile(filePath, 'utf-8')
    return { path: filePath, content }
  })

  ipcMain.handle('file:save-as', async (_event, content: string) => {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown'] }],
    })

    if (result.canceled || !result.filePath) {
      return null
    }

    await fs.writeFile(result.filePath, content, 'utf-8')
    return result.filePath
  })

  ipcMain.handle('file:save', async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8')
    return true
  })
}

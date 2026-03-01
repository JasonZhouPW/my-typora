import { ipcMain, dialog } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { addFileToRecent } from './main'

export function registerFileHandlers() {
  // Read directory contents
  ipcMain.handle('file:read-dir', async (_event, dirPath?: string) => {
    const targetPath = dirPath || os.homedir()
    try {
      const entries = await fs.readdir(targetPath, { withFileTypes: true })
      const items = entries
        .filter(entry => !entry.name.startsWith('.')) // Filter hidden files
        .map(entry => ({
          name: entry.name,
          path: path.join(targetPath, entry.name),
          type: entry.isDirectory() ? 'folder' : 'file',
          isDirectory: entry.isDirectory(),
        }))
        .sort((a, b) => {
          // Folders first, then files, both alphabetically
          if (a.type === b.type) return a.name.localeCompare(b.name)
          return a.type === 'folder' ? -1 : 1
        })
      return items
    } catch (error) {
      console.error('Failed to read directory:', error)
      return []
    }
  })

  // Read specific file content
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      // Add to recent files
      addFileToRecent(filePath)
      return { path: filePath, content }
    } catch (error) {
      console.error('Failed to read file:', error)
      return null
    }
  })

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
    // Add to recent files
    addFileToRecent(filePath)
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
    // Add to recent files
    addFileToRecent(result.filePath)
    return result.filePath
  })

  ipcMain.handle('file:save', async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8')
    // Add to recent files
    addFileToRecent(filePath)
    return true
  })
}

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

  // Create new file
  ipcMain.handle('file:create', async (_event, dirPath: string, fileName: string) => {
    try {
      const filePath = path.join(dirPath, fileName)
      await fs.writeFile(filePath, '', 'utf-8')
      return { path: filePath, name: fileName }
    } catch (error) {
      console.error('Failed to create file:', error)
      return null
    }
  })

  // Rename file or folder
  ipcMain.handle('file:rename', async (_event, oldPath: string, newName: string) => {
    try {
      const dirPath = path.dirname(oldPath)
      const newPath = path.join(dirPath, newName)
      await fs.rename(oldPath, newPath)
      return { success: true, newPath }
    } catch (error) {
      console.error('Failed to rename:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  })

  // Delete file or folder
  ipcMain.handle('file:delete', async (_event, itemPath: string, isDirectory: boolean) => {
    try {
      if (isDirectory) {
        // Use rm with recursive option to delete non-empty folders
        await fs.rm(itemPath, { recursive: true, force: true })
      } else {
        await fs.unlink(itemPath)
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to delete:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  })

  // Get file stats for sorting
  ipcMain.handle('file:get-stats', async (_event, dirPath?: string) => {
    const targetPath = dirPath || os.homedir()
    try {
      const entries = await fs.readdir(targetPath, { withFileTypes: true })

      const itemsWithStats = await Promise.all(
        entries
          .filter(entry => !entry.name.startsWith('.'))
          .map(async (entry) => {
            const filePath = path.join(targetPath, entry.name)
            try {
              const stats = await fs.stat(filePath)
              return {
                name: entry.name,
                path: filePath,
                type: entry.isDirectory() ? 'folder' : 'file',
                isDirectory: entry.isDirectory(),
                mtime: stats.mtimeMs,
                birthtime: stats.birthtimeMs,
              }
            } catch {
              return {
                name: entry.name,
                path: filePath,
                type: entry.isDirectory() ? 'folder' : 'file',
                isDirectory: entry.isDirectory(),
                mtime: 0,
                birthtime: 0,
              }
            }
          })
      )
      return itemsWithStats
    } catch (error) {
      console.error('Failed to get file stats:', error)
      return []
    }
  })
}

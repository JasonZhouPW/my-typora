import { ipcMain, dialog } from 'electron'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import * as path from 'path'
import * as os from 'os'

const HIDDEN_PATTERNS = ['.', 'node_modules', '.git', '.DS_Store', 'Thumbs.db']

export function registerFileHandlers() {
  // Existing file handlers
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

  // File tree handlers
  ipcMain.handle('file-tree:get-roots', async () => {
    const homeDir = os.homedir()
    const roots: any[] = []

    if (fsSync.existsSync(homeDir)) {
      roots.push({
        name: path.basename(homeDir),
        path: homeDir,
        type: 'folder',
        children: [],
        isExpanded: false,
      })
    }

    return roots
  })

  ipcMain.handle('file-tree:read-directory', async (_event, dirPath: string) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const nodes: any[] = []

      for (const entry of entries) {
        if (HIDDEN_PATTERNS.some(p => entry.name.startsWith(p))) {
          continue
        }

        const fullPath = path.join(dirPath, entry.name)
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? 'folder' : 'file',
          children: [],
          isExpanded: false,
        })
      }

      nodes.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name)
        }
        return a.type === 'folder' ? -1 : 1
      })

      return nodes
    } catch (error) {
      console.error('Error reading directory:', error)
      return []
    }
  })

  ipcMain.handle('file-tree:read-file', async (_event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      console.error('Error reading file:', error)
      return ''
    }
  })

  ipcMain.handle('file-tree:create-file', async (_event, dirPath: string, name: string) => {
    try {
      const fullPath = path.join(dirPath, name)
      await fs.writeFile(fullPath, '', 'utf-8')
      return { success: true, path: fullPath }
    } catch (error) {
      console.error('Error creating file:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('file-tree:create-folder', async (_event, dirPath: string, name: string) => {
    try {
      const fullPath = path.join(dirPath, name)
      await fs.mkdir(fullPath, { recursive: true })
      return { success: true, path: fullPath }
    } catch (error) {
      console.error('Error creating folder:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('file-tree:delete', async (_event, itemPath: string) => {
    try {
      const stats = await fs.stat(itemPath)
      if (stats.isDirectory()) {
        await fs.rm(itemPath, { recursive: true })
      } else {
        await fs.unlink(itemPath)
      }
      return { success: true }
    } catch (error) {
      console.error('Error deleting:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('file-tree:rename', async (_event, oldPath: string, newName: string) => {
    try {
      const dirPath = path.dirname(oldPath)
      const newPath = path.join(dirPath, newName)
      await fs.rename(oldPath, newPath)
      return { success: true, path: newPath }
    } catch (error) {
      console.error('Error renaming:', error)
      return { success: false, error: String(error) }
    }
  })
}

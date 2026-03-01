import { app, BrowserWindow } from 'electron'
import path from 'path'
import { registerFileHandlers } from './fileOperations'
import { createMenu, updateRecentFilesMenu } from './menu'

let mainWindow: BrowserWindow | null = null

// Recent files list (stored in memory for now)
let recentFiles: string[] = []
const MAX_RECENT_FILES = 10

function addToRecentFiles(filePath: string) {
  // Remove if already exists
  recentFiles = recentFiles.filter(f => f !== filePath)
  // Add to beginning
  recentFiles.unshift(filePath)
  // Limit size
  if (recentFiles.length > MAX_RECENT_FILES) {
    recentFiles = recentFiles.slice(0, MAX_RECENT_FILES)
  }
  // Update menu
  updateRecentFilesMenu(recentFiles)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Export function to add file to recent list
export function addFileToRecent(filePath: string) {
  addToRecentFiles(filePath)
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

app.on('ready', () => {
  createWindow()
  registerFileHandlers()
  createMenu()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

import { app, BrowserWindow, ipcMain, protocol } from 'electron'
import fs from 'fs'
import path from 'path'
import { registerFileHandlers } from './fileOperations'
import { registerExportHandlers } from './exportOperations'
import { createMenu, updateRecentFilesMenu } from './menu'

let mainWindow: BrowserWindow | null = null
let pendingExternalFiles: string[] = []

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'typra-local',
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
])

const SUPPORTED_FILE_EXTENSIONS = new Set([
  '.md',
  '.markdown',
  '.mdown',
  '.mkd',
  '.mkdn',
  '.mdwn',
  '.mdtxt',
  '.mdtext',
  '.txt',
])

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

function isSupportedExternalFile(filePath: string): boolean {
  try {
    const extension = path.extname(filePath).toLowerCase()
    return SUPPORTED_FILE_EXTENSIONS.has(extension) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

function getExternalFilesFromArgv(argv: string[]): string[] {
  return argv
    .filter(arg => !arg.startsWith('-'))
    .map(arg => path.resolve(arg))
    .filter(isSupportedExternalFile)
}

function sendExternalFileToRenderer(filePath: string) {
  if (!mainWindow || mainWindow.webContents.isLoading()) {
    pendingExternalFiles.push(filePath)
    return
  }

  mainWindow.webContents.send('file:open-file', filePath)
  mainWindow.show()
  mainWindow.focus()
}

function consumePendingExternalFiles(): string[] {
  const files = [...pendingExternalFiles]
  pendingExternalFiles = []
  return files
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

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const files = getExternalFilesFromArgv(argv)
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    } else if (app.isReady()) {
      createWindow()
    }
    files.forEach(sendExternalFileToRenderer)
  })
}

app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (isSupportedExternalFile(filePath)) {
    sendExternalFileToRenderer(filePath)
  }
})

// Export function to add file to recent list
export function addFileToRecent(filePath: string) {
  addToRecentFiles(filePath)
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

app.on('ready', () => {
  protocol.registerFileProtocol('typra-local', (request, callback) => {
    try {
      const requestUrl = new URL(request.url)
      if (requestUrl.hostname !== 'asset') {
        callback({ error: -6 })
        return
      }
      callback({ path: decodeURIComponent(requestUrl.pathname.slice(1)) })
    } catch {
      callback({ error: -300 })
    }
  })
  pendingExternalFiles.push(...getExternalFilesFromArgv(process.argv))
  createWindow()
  registerFileHandlers()
  registerExportHandlers()
  ipcMain.handle('file:consume-open-files', () => consumePendingExternalFiles())
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

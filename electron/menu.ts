import { Menu, app, BrowserWindow } from 'electron'
import path from 'path'

let recentFiles: string[] = []

export function createMenu() {
  updateMenu()
}

// Export a function to update recent files menu, called from main.ts
export function updateRecentFilesMenu(files: string[]) {
  recentFiles = files
  updateMenu()
}

function updateMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.webContents.send('file:new')
            }
          },
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.webContents.send('file:open-request')
            }
          },
        },
        {
          label: 'Open Recent...',
          enabled: recentFiles.length > 0,
          submenu: recentFiles.length > 0
            ? recentFiles.map(file => ({
                label: path.basename(file),
                click: () => {
                  const focusedWindow = BrowserWindow.getFocusedWindow()
                  if (focusedWindow) {
                    focusedWindow.webContents.send('file:open-file', file)
                  }
                },
              }))
            : [{ label: 'No Recent Files', enabled: false }],
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.webContents.send('file:save-request')
            }
          },
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.webContents.send('file:save-as-request')
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Copy Markdown',
              click: () => {
                const focusedWindow = BrowserWindow.getFocusedWindow()
                if (focusedWindow) {
                  focusedWindow.webContents.send('export:copy-markdown')
                }
              },
            },
            {
              label: 'Copy HTML Preview',
              click: () => {
                const focusedWindow = BrowserWindow.getFocusedWindow()
                if (focusedWindow) {
                  focusedWindow.webContents.send('export:copy-html')
                }
              },
            },
            { type: 'separator' },
            { label: 'Export PDF', enabled: false },
            { label: 'Export DOCX', enabled: false },
          ],
        },
        { type: 'separator' },
        {
          label: process.platform === 'darwin' ? 'Quit Typora' : 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

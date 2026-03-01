"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const path = require("path");
const fs = require("fs/promises");
const os = require("os");
function registerFileHandlers() {
  electron.ipcMain.handle("file:read-dir", async (_event, dirPath) => {
    const targetPath = dirPath || os.homedir();
    try {
      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      const items = entries.filter((entry) => !entry.name.startsWith(".")).map((entry) => ({
        name: entry.name,
        path: path.join(targetPath, entry.name),
        type: entry.isDirectory() ? "folder" : "file",
        isDirectory: entry.isDirectory()
      })).sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "folder" ? -1 : 1;
      });
      return items;
    } catch (error) {
      console.error("Failed to read directory:", error);
      return [];
    }
  });
  electron.ipcMain.handle("file:read", async (_event, filePath) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      addFileToRecent(filePath);
      return { path: filePath, content };
    } catch (error) {
      console.error("Failed to read file:", error);
      return null;
    }
  });
  electron.ipcMain.handle("file:open", async () => {
    const result = await electron.dialog.showOpenDialog({
      filters: [{ name: "Markdown Files", extensions: ["md", "markdown", "txt"] }],
      properties: ["openFile"]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    const filePath = result.filePaths[0];
    const content = await fs.readFile(filePath, "utf-8");
    addFileToRecent(filePath);
    return { path: filePath, content };
  });
  electron.ipcMain.handle("file:save-as", async (_event, content) => {
    const result = await electron.dialog.showSaveDialog({
      filters: [{ name: "Markdown Files", extensions: ["md", "markdown"] }]
    });
    if (result.canceled || !result.filePath) {
      return null;
    }
    await fs.writeFile(result.filePath, content, "utf-8");
    addFileToRecent(result.filePath);
    return result.filePath;
  });
  electron.ipcMain.handle("file:save", async (_event, filePath, content) => {
    await fs.writeFile(filePath, content, "utf-8");
    addFileToRecent(filePath);
    return true;
  });
}
let recentFiles$1 = [];
function createMenu() {
  updateMenu();
}
function updateRecentFilesMenu(files) {
  recentFiles$1 = files;
  updateMenu();
}
function updateMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            const focusedWindow = electron.BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send("file:new");
            }
          }
        },
        {
          label: "Open...",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            const focusedWindow = electron.BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send("file:open-request");
            }
          }
        },
        {
          label: "Open Recent...",
          enabled: recentFiles$1.length > 0,
          submenu: recentFiles$1.length > 0 ? recentFiles$1.map((file) => ({
            label: path.basename(file),
            click: () => {
              const focusedWindow = electron.BrowserWindow.getFocusedWindow();
              if (focusedWindow) {
                focusedWindow.webContents.send("file:open-file", file);
              }
            }
          })) : [{ label: "No Recent Files", enabled: false }]
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            const focusedWindow = electron.BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send("file:save-request");
            }
          }
        },
        {
          label: "Save As...",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => {
            const focusedWindow = electron.BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send("file:save-as-request");
            }
          }
        },
        { type: "separator" },
        {
          label: process.platform === "darwin" ? "Quit Typora" : "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Alt+F4",
          click: () => {
            electron.app.quit();
          }
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "resetZoom" }
      ]
    }
  ];
  const menu = electron.Menu.buildFromTemplate(template);
  electron.Menu.setApplicationMenu(menu);
}
let mainWindow = null;
let recentFiles = [];
const MAX_RECENT_FILES = 10;
function addToRecentFiles(filePath) {
  recentFiles = recentFiles.filter((f) => f !== filePath);
  recentFiles.unshift(filePath);
  if (recentFiles.length > MAX_RECENT_FILES) {
    recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
  }
  updateRecentFilesMenu(recentFiles);
}
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function addFileToRecent(filePath) {
  addToRecentFiles(filePath);
}
function getMainWindow() {
  return mainWindow;
}
electron.app.on("ready", () => {
  createWindow();
  registerFileHandlers();
  createMenu();
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
exports.addFileToRecent = addFileToRecent;
exports.getMainWindow = getMainWindow;

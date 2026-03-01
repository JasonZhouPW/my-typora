"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  file: {
    open: () => electron.ipcRenderer.invoke("file:open"),
    saveAs: (content) => electron.ipcRenderer.invoke("file:save-as", content),
    save: (filePath, content) => electron.ipcRenderer.invoke("file:save", filePath, content),
    readDir: (dirPath) => electron.ipcRenderer.invoke("file:read-dir", dirPath),
    read: (filePath) => electron.ipcRenderer.invoke("file:read", filePath)
  },
  on: (channel, listener) => {
    electron.ipcRenderer.on(channel, listener);
  },
  removeListener: (channel, listener) => {
    electron.ipcRenderer.removeListener(channel, listener);
  }
});

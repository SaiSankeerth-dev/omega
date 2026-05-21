const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('omega', {
  platform: process.platform,
  isDesktop: true,
  getVersion: () => ipcRenderer.invoke('get-version'),
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (_event, action) => callback(action)),
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close'),
})

const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktopSettings', Object.freeze({
  load: () => ipcRenderer.invoke('settings:load'),
  models: (input) => ipcRenderer.invoke('settings:models', input),
  save: (input) => ipcRenderer.invoke('settings:save', input),
  close: () => ipcRenderer.invoke('settings:close'),
  openFolder: () => ipcRenderer.invoke('settings:folder'),
}));

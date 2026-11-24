const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('creatorDesktop', Object.freeze({
  openSettings: () => ipcRenderer.invoke('desktop:settings'),
  setBusy: (value) => ipcRenderer.invoke('desktop:busy', value),
}));

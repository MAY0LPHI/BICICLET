const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  loadClients: () => ipcRenderer.invoke('load-clients'),
  saveClients: (clients) => ipcRenderer.invoke('save-clients', clients),
  loadRegistros: () => ipcRenderer.invoke('load-registros'),
  saveRegistros: (registros) => ipcRenderer.invoke('save-registros', registros),
  getStoragePath: () => ipcRenderer.invoke('get-storage-path')
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('env', {
  isElectron: true
});

contextBridge.exposeInMainWorld('licensing', {
  getHardwareId: () => ipcRenderer.invoke('licensing:getHardwareId'),
  validateLicense: (licenseKey) => ipcRenderer.invoke('licensing:validateLicense', licenseKey),
  saveLicense: (licenseKey) => ipcRenderer.invoke('licensing:saveLicense', licenseKey),
  checkLicense: () => ipcRenderer.invoke('licensing:checkLicense'),
});

module.exports = {};

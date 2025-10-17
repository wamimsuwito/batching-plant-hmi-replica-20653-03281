const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('env', {
  isElectron: true
});

module.exports = {};

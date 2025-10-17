const { app } = require('electron');

// Auto-start untuk Windows
function enableAutoStart() {
  if (process.platform === 'win32') {
    const exePath = process.execPath;
    const appName = 'BatchPlantHMI';
    
    app.setLoginItemSettings({
      openAtLogin: true,
      path: exePath,
      args: []
    });
  }
}

function disableAutoStart() {
  app.setLoginItemSettings({
    openAtLogin: false
  });
}

module.exports = { enableAutoStart, disableAutoStart };

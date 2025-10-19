import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const licensing = require('./licensing.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    title: 'Batch Plant Control System - HMI',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    backgroundColor: '#1a1f2e',
    show: false,
    autoHideMenuBar: !isDev,
    fullscreenable: true,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.reload(),
        },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => {
            if (mainWindow) {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.setZoomLevel(0),
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            if (mainWindow) {
              const level = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(level + 0.5);
            }
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            if (mainWindow) {
              const level = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(level - 0.5);
            }
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'About Batch Plant HMI',
                message: 'Batch Plant Control System',
                detail: 'Version 1.0.0\nIndustrial HMI for Concrete Batching Plant',
                buttons: ['OK'],
              });
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

// Setup licensing IPC handlers
ipcMain.handle('licensing:getHardwareId', () => {
  return licensing.getHardwareId();
});

ipcMain.handle('licensing:validateLicense', (event, licenseKey) => {
  return licensing.validateLicenseKey(licenseKey);
});

ipcMain.handle('licensing:saveLicense', (event, licenseKey) => {
  return licensing.saveLicense(licenseKey);
});

ipcMain.handle('licensing:checkLicense', () => {
  return licensing.checkLicense();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Explicitly set application name
app.setName('Pouch');

let mainWindow;

// Configure Auto-Updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function sendUpdateStatus(status, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', {
      status,
      ...data,
      currentVersion: app.getVersion(),
      isPackaged: app.isPackaged
    });
  }
}

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus('checking');
  });

  autoUpdater.on('update-available', (info) => {
    sendUpdateStatus('available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    sendUpdateStatus('not-available', {
      version: info?.version || app.getVersion()
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus('downloading', {
      percent: Math.round(progress.percent || 0),
      speed: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus('downloaded', {
      version: info.version
    });
  });

  autoUpdater.on('error', (err) => {
    sendUpdateStatus('error', {
      message: err.message
    });
  });

  // Only auto-check on startup if packaged
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.warn('Check for updates skipped:', err.message);
      });
    }, 3000);
  }
}

// IPC Handlers
ipcMain.handle('get-app-version', () => {
  return {
    version: app.getVersion(),
    isPackaged: app.isPackaged
  };
});

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    sendUpdateStatus('not-available', {
      message: 'ระบบกำลังทำงานในโหมด Development (ยังไม่ได้แพ็กไฟล์ .exe) การอัปเดตอัตโนมัติจะทำงานในตัวติดตั้ง Production'
    });
    return { status: 'dev-mode' };
  }

  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'ok', result };
  } catch (err) {
    sendUpdateStatus('error', { message: err.message });
    return { status: 'error', message: err.message };
  }
});

ipcMain.handle('restart-and-install', () => {
  if (app.isPackaged) {
    autoUpdater.quitAndInstall();
  }
});

// Boot Express backend server within the Electron process
try {
  require(path.join(__dirname, 'server', 'index.js'));
} catch (e) {
  console.error('Failed to start internal backend server:', e);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Pouch',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the running internal express server
  mainWindow.loadURL('http://localhost:5001');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Give internal server 600ms to bind port 5001
  setTimeout(() => {
    createWindow();
    setupAutoUpdater();
  }, 600);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

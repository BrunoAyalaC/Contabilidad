import path from 'path';
import { app, BrowserWindow } from 'electron';

const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(process.cwd(), 'electron', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    const url = 'http://localhost:5173';
    win.loadURL(url);
    win.webContents.openDevTools();
  } else {
    const indexHtml = `file://${path.join(process.cwd(), 'dist', 'index.html')}`;
    win.loadURL(indexHtml);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

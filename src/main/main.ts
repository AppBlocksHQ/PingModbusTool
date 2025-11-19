import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { PingService } from './ping-service';
import { ModbusService } from './modbus-service';
import { StorageService } from './storage-service';

let mainWindow: BrowserWindow | null = null;
let pingService: PingService;
let modbusService: ModbusService;
let storageService: StorageService;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  storageService = new StorageService();
  pingService = new PingService(storageService);
  modbusService = new ModbusService(storageService);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', async () => {
  pingService.stopAll();
  await modbusService.stopAll();
});

// IPC Handlers

// Ping handlers
ipcMain.on('ping:start', (event, { sessionId, ip }) => {
  if (mainWindow) {
    pingService.startPing(sessionId, ip, mainWindow);
  }
});

ipcMain.on('ping:stop', (event, { sessionId }) => {
  pingService.stopPing(sessionId);
});

// Modbus handlers
ipcMain.on('modbus:start', async (event, { sessionId, config }) => {
  if (mainWindow) {
    try {
      await modbusService.startModbus(sessionId, config, mainWindow);
    } catch (error) {
      console.error('Failed to start Modbus session:', error);
    }
  }
});

ipcMain.on('modbus:stop', async (event, { sessionId }) => {
  await modbusService.stopModbus(sessionId);
});

// Storage handlers
ipcMain.handle('storage:list-sessions', () => {
  return storageService.listSessions();
});

ipcMain.handle('storage:read-ping-session', async (event, filename) => {
  return await storageService.readPingSession(filename);
});

ipcMain.handle('storage:read-modbus-session', async (event, filename) => {
  return await storageService.readModbusSession(filename);
});

ipcMain.handle('storage:delete-session', async (event, filename) => {
  storageService.deleteSession(filename);
});


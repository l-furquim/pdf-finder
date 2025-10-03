import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { getFilesFromPaths } from './utils/fileUtils';
import { searchCpfsInPdf } from './services/pdfService';
import { writeLogEntries, getLogDirectoryPath } from './services/logService';
import { FileItem, SearchResult, LogEntry } from './types';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();
};

ipcMain.handle('select-files', async (): Promise<FileItem[]> => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });

  if (result.canceled) return [];

  return getFilesFromPaths(result.filePaths);
});

ipcMain.handle('select-folder', async (): Promise<FileItem[]> => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (result.canceled) return [];

  return getFilesFromPaths(result.filePaths);
});

ipcMain.handle('process-pdf', async (_event, filePath: string, cpfList: string[]): Promise<SearchResult[]> => {
  const fileName = filePath.split(/[\\/]/).pop() || '';
  return searchCpfsInPdf(filePath, fileName, cpfList);
});

ipcMain.handle('write-log', async (_event, entries: LogEntry[]): Promise<void> => {
  return writeLogEntries(entries);
});

ipcMain.handle('open-pdf-at-page', async (_event, filePath: string, pageNumber: number): Promise<void> => {
  await shell.openPath(filePath);
});

ipcMain.handle('open-log-folder', async (): Promise<void> => {
  const logPath = getLogDirectoryPath();
  await shell.openPath(logPath);
});

app.on('ready', createWindow);

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

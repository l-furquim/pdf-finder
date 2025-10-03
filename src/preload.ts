import { contextBridge, ipcRenderer } from 'electron';
import { FileItem, SearchResult, LogEntry } from './types';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: (): Promise<FileItem[]> => ipcRenderer.invoke('select-files'),
  selectFolder: (): Promise<FileItem[]> => ipcRenderer.invoke('select-folder'),
  processPdf: (filePath: string, cpfList: string[]): Promise<SearchResult[]> =>
    ipcRenderer.invoke('process-pdf', filePath, cpfList),
  writeLog: (entries: LogEntry[]): Promise<void> =>
    ipcRenderer.invoke('write-log', entries),
  openPdfAtPage: (filePath: string, pageNumber: number): Promise<void> =>
    ipcRenderer.invoke('open-pdf-at-page', filePath, pageNumber),
  openLogFolder: (): Promise<void> =>
    ipcRenderer.invoke('open-log-folder'),
});

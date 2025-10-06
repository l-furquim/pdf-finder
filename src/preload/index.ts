import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { SearchConfig, PdfFile, SearchResult, ProcessingProgress } from '../types'

const api = {
  selectFiles: (): Promise<PdfFile[]> => ipcRenderer.invoke('select-files'),
  selectDirectory: (): Promise<PdfFile[]> => ipcRenderer.invoke('select-directory'),

  processPdfs: (config: SearchConfig): void => ipcRenderer.send('process-pdfs', config),
  cancelProcessing: (): void => ipcRenderer.send('cancel-processing'),

  getLogsDirectory: (): Promise<string> => ipcRenderer.invoke('get-logs-directory'),
  openLogsDirectory: (): void => ipcRenderer.send('open-logs-directory'),

  openPdfAtPage: (filePath: string, pageNumber: number): void =>
    ipcRenderer.send('open-pdf-at-page', filePath, pageNumber),

  onProcessingStarted: (callback: () => void) => {
    ipcRenderer.on('processing-started', callback)
    return () => ipcRenderer.removeListener('processing-started', callback)
  },
  onProcessingProgress: (callback: (progress: ProcessingProgress) => void) => {
    const listener = (_: any, progress: ProcessingProgress) => callback(progress)
    ipcRenderer.on('processing-progress', listener)
    return () => ipcRenderer.removeListener('processing-progress', listener)
  },
  onProcessingResult: (callback: (result: SearchResult) => void) => {
    const listener = (_: any, result: SearchResult) => callback(result)
    ipcRenderer.on('processing-result', listener)
    return () => ipcRenderer.removeListener('processing-result', listener)
  },
  onProcessingComplete: (callback: (results: SearchResult[]) => void) => {
    const listener = (_: any, results: SearchResult[]) => callback(results)
    ipcRenderer.on('processing-complete', listener)
    return () => ipcRenderer.removeListener('processing-complete', listener)
  },
  onProcessingError: (callback: (error: string) => void) => {
    const listener = (_: any, error: string) => callback(error)
    ipcRenderer.on('processing-error', listener)
    return () => ipcRenderer.removeListener('processing-error', listener)
  },
  onProcessingCancelled: (callback: () => void) => {
    ipcRenderer.on('processing-cancelled', callback)
    return () => ipcRenderer.removeListener('processing-cancelled', callback)
  },
  onProcessingFileError: (callback: (data: { filePath: string; error: string }) => void) => {
    const listener = (_: any, data: { filePath: string; error: string }) => callback(data)
    ipcRenderer.on('processing-file-error', listener)
    return () => ipcRenderer.removeListener('processing-file-error', listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  ;(window as any).electron = electronAPI
  ;(window as any).api = api
}

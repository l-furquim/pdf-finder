import { ElectronAPI } from '@electron-toolkit/preload'
import type { SearchConfig, PdfFile, SearchResult, ProcessingProgress, ExcelProcessingResult, DatabaseQueryResult } from '../types'

interface Api {
  selectFiles: () => Promise<PdfFile[]>
  selectDirectory: () => Promise<PdfFile[]>
  processPdfs: (config: SearchConfig) => void
  cancelProcessing: () => void
  getLogsDirectory: () => Promise<string>
  openLogsDirectory: () => void
  openPdfAtPage: (filePath: string, pageNumber: number) => void
  selectExcelFile: () => Promise<string | null>
  processExcelFile: (filePath: string) => Promise<ExcelProcessingResult>
  queryNotFoundCpfs: (cpfs: string[]) => Promise<DatabaseQueryResult>
  testDatabaseConnection: () => Promise<{ success: boolean; message: string }>
  onProcessingStarted: (callback: () => void) => () => void
  onProcessingProgress: (callback: (progress: ProcessingProgress) => void) => () => void
  onProcessingResult: (callback: (result: SearchResult) => void) => () => void
  onProcessingComplete: (callback: (results: SearchResult[]) => void) => () => void
  onProcessingError: (callback: (error: string) => void) => () => void
  onProcessingCancelled: (callback: () => void) => () => void
  onProcessingFileError: (callback: (data: { filePath: string; error: string }) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
export interface SearchResult {
  cpf: string
  filePath: string
  fileName: string
  pageNumber: number
  snippet: string
  timestamp: Date
}

export interface ProcessingProgress {
  currentFile: string
  processedFiles: number
  totalFiles: number
  currentPage?: number
  totalPages?: number
}

export interface CsvLogEntry {
  timestamp: string
  cpf: string
  filePath: string
  found: boolean
  pages: string
}

export interface PdfFile {
  path: string
  name: string
  size: number
}

export interface SearchConfig {
  cpfs: string[]
  permissiveMode: boolean
  files: PdfFile[]
}

export interface WorkerMessage {
  type: 'progress' | 'result' | 'error' | 'complete'
  data?: any
}

export interface IpcChannels {
  'select-files': () => Promise<PdfFile[]>
  'select-directory': () => Promise<PdfFile[]>
  'process-pdfs': (config: SearchConfig) => void
  'cancel-processing': () => void
  'open-pdf-at-page': (filePath: string, pageNumber: number) => void
  'get-logs-directory': () => Promise<string>
  'open-logs-directory': () => void
}

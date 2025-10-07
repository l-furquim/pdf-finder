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
  files: PdfFile[]
}

export interface WorkerMessage {
  type: 'progress' | 'result' | 'error' | 'complete'
  data?: any
}

export interface EmployeeRecord {
  Matricula: string
  Nome: string
  CPF: string
  Cliente: string
  Agencia: string
  Conta: string
  'Tipo de pagamento': string
  'Status Comprovante': string
}

export interface ExcelProcessingResult {
  cpfs: string[]
  totalRecords: number
  prodespRecords: number
  fileName: string
}

export interface EmployeeData {
  MATRICULA: string
  NOME: string
}

export interface NotFoundCpfWithData {
  cpf: string
  employeeData?: EmployeeData
  error?: string
}

export interface DatabaseQueryResult {
  success: boolean
  data: Record<string, EmployeeData>
  errors: string[]
}

export interface IpcChannels {
  'select-files': () => Promise<PdfFile[]>
  'select-directory': () => Promise<PdfFile[]>
  'process-pdfs': (config: SearchConfig) => void
  'cancel-processing': () => void
  'open-pdf-at-page': (filePath: string, pageNumber: number) => void
  'get-logs-directory': () => Promise<string>
  'open-logs-directory': () => void
  'process-excel-file': (filePath: string) => Promise<ExcelProcessingResult>
  'select-excel-file': () => Promise<string | null>
}

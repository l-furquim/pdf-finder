export interface SearchResult {
  cpf: string;
  filePath: string;
  fileName: string;
  pageNumber: number;
  snippet: string;
  timestamp: Date;
}

export interface SearchOptions {
  cpfList: string[];
  permissiveMode: boolean;
  files: FileItem[];
}

export interface FileItem {
  path: string;
  name: string;
  size: number;
}

export interface ProcessingStatus {
  total: number;
  processed: number;
  currentFile: string;
  isProcessing: boolean;
}

export interface CpfValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

export interface LogEntry {
  timestamp: string;
  cpf: string;
  filePath: string;
  found: boolean;
  pages: string;
}

export interface ElectronAPI {
  selectFiles: () => Promise<FileItem[]>;
  selectFolder: () => Promise<FileItem[]>;
  processPdf: (filePath: string, cpfList: string[]) => Promise<SearchResult[]>;
  writeLog: (entries: LogEntry[]) => Promise<void>;
  openPdfAtPage: (filePath: string, pageNumber: number) => Promise<void>;
  openLogFolder: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

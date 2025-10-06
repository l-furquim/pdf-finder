import { format } from 'date-fns'
import type { CsvLogEntry } from '../types'

export function formatBrazilianDateTime(date: Date): string {
  return format(date, 'dd/MM/yyyy HH:mm')
}

export function getLogFileName(): string {
  const today = format(new Date(), 'yyyy-MM-dd')
  return `${today}.csv`
}

export function getLogDirectoryName(): string {
  return 'leitor_documentos'
}

export function createCsvLogEntry(
  cpf: string,
  filePath: string,
  found: boolean,
  pages: number[]
): CsvLogEntry {
  return {
    timestamp: formatBrazilianDateTime(new Date()),
    cpf,
    filePath,
    found,
    pages: pages.length > 0 ? pages.join(';') : ''
  }
}

export function formatCsvRow(entry: CsvLogEntry): string {
  const escapeCsv = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  return [
    escapeCsv(entry.timestamp),
    escapeCsv(entry.cpf),
    escapeCsv(entry.filePath),
    entry.found ? 'true' : 'false',
    escapeCsv(entry.pages)
  ].join(',')
}

export function getCsvHeader(): string {
  return 'timestamp,cpf,filePath,found,pages'
}
import * as XLSX from 'xlsx'
import type { SearchResult, EmployeeData } from '../types'
import { formatCpf } from './cpf'

export function exportFoundToCSV(results: SearchResult[]): string {
  const headers = ['CPF', 'Arquivo', 'Página']
  const rows = results.map((result) => [
    formatCpf(result.cpf),
    result.fileName,
    result.pageNumber.toString()
  ])

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')

  return csvContent
}

export function exportNotFoundToCSV(cpfs: string[]): string {
  const headers = ['CPF', 'Status']
  const rows = cpfs.map((cpf) => [formatCpf(cpf), 'Não encontrado'])

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')

  return csvContent
}

export function exportFoundToXLSX(results: SearchResult[]): ArrayBuffer {
  const data = results.map((result) => ({
    CPF: formatCpf(result.cpf),
    Arquivo: result.fileName,
    Página: result.pageNumber
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Encontrados')

  worksheet['!cols'] = [{ wch: 18 }, { wch: 40 }, { wch: 10 }]

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
}

export function exportNotFoundToXLSX(cpfs: string[]): ArrayBuffer {
  const data = cpfs.map((cpf) => ({
    CPF: formatCpf(cpf),
    Status: 'Não encontrado'
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Não Encontrados')

  worksheet['!cols'] = [{ wch: 18 }, { wch: 20 }]

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
}

export function exportCPFsToTXT(cpfs: string[], formatted: boolean = false): string {
  if (formatted) {
    return cpfs.map((cpf) => formatCpf(cpf)).join(', ')
  }
  return cpfs.join(', ')
}

export function exportFoundCPFsToTXT(results: SearchResult[], formatted: boolean = false): string {
  const uniqueCpfs = Array.from(new Set(results.map((r) => r.cpf)))
  return exportCPFsToTXT(uniqueCpfs, formatted)
}

export function exportNotFoundWithDatabaseToCSV(
  cpfs: string[],
  databaseData: Record<string, EmployeeData>
): string {
  const headers = ['CPF', 'Matrícula', 'Nome']
  const rows = cpfs.map((cpf) => {
    const data = databaseData[cpf]
    return [
      formatCpf(cpf),
      data?.MATRICULA || 'N/A',
      data?.NOME || 'N/A'
    ]
  })

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')

  return csvContent
}

export function exportNotFoundWithDatabaseToXLSX(
  cpfs: string[],
  databaseData: Record<string, EmployeeData>
): ArrayBuffer {
  const data = cpfs.map((cpf) => {
    const employeeInfo = databaseData[cpf]
    return {
      CPF: formatCpf(cpf),
      Matrícula: employeeInfo?.MATRICULA || 'N/A',
      Nome: employeeInfo?.NOME || 'N/A'
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Não Encontrados')

  worksheet['!cols'] = [{ wch: 18 }, { wch: 15 }, { wch: 35 }]

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
}

export function downloadFile(content: string | ArrayBuffer, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateTimestampedFilename(prefix: string, extension: string): string {
  const now = new Date()
  const timestamp = now
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_')
  return `${prefix}_${timestamp}.${extension}`
}

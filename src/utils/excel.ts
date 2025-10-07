import * as XLSX from 'xlsx'
import { normalizeCpf } from './cpf'
import type { EmployeeRecord, ExcelProcessingResult } from '../types'

export async function processExcelFile(
  filePath: string
): Promise<ExcelProcessingResult> {
  const fileName = filePath.split(/[\\/]/).pop() || filePath

  console.log(`[Excel Processor] Starting to process: ${fileName}`)

  const workbook = XLSX.readFile(filePath, {
    type: 'file',
    cellDates: false,
    cellNF: false,
    cellText: false
  })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('No sheets found in the workbook')
  }

  console.log(`[Excel Processor] Reading sheet: ${sheetName}`)

  const worksheet = workbook.Sheets[sheetName]

  const data = XLSX.utils.sheet_to_json<EmployeeRecord>(worksheet, {
    header: undefined,
    defval: '',
    raw: false
  })

  console.log(`[Excel Processor] Total records found: ${data.length}`)

  const prodespRecords = data.filter((record) => {
    const cliente = String(record.Cliente || '').toUpperCase()
    return cliente.includes('PRODESP')
  })

  console.log(`[Excel Processor] PRODESP records found: ${prodespRecords.length}`)

  const cpfSet = new Set<string>()

  for (const record of prodespRecords) {
    const cpfValue = String(record.CPF || '').trim()

    if (!cpfValue) {
      continue
    }

    const normalizedCpf = normalizeCpf(cpfValue)

    if (normalizedCpf) {
      cpfSet.add(normalizedCpf)
    } else {
      console.warn(
        `[Excel Processor] Invalid CPF skipped: "${cpfValue}" for employee: ${record.Nome || 'Unknown'}`
      )
    }
  }

  const cpfs = Array.from(cpfSet).sort()

  console.log(
    `[Excel Processor] Extracted ${cpfs.length} unique valid CPFs from ${prodespRecords.length} PRODESP records`
  )

  return {
    cpfs,
    totalRecords: data.length,
    prodespRecords: prodespRecords.length,
    fileName
  }
}

export function isValidExcelFile(filePath: string): boolean {
  const lowerPath = filePath.toLowerCase()
  return lowerPath.endsWith('.xlsx') || lowerPath.endsWith('.xls') || lowerPath.endsWith('.csv')
}

export function getSupportedExcelExtensions(): string[] {
  return ['xlsx', 'xls', 'csv']
}

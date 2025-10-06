import { app } from 'electron'
import { join } from 'path'
import { mkdir, appendFile, access } from 'fs/promises'
import { constants } from 'fs'
import type { SearchResult } from '../types'
import { getLogFileName, getLogDirectoryName, createCsvLogEntry, formatCsvRow, getCsvHeader } from '../utils/csv'

export function getLogsDirectory(): string {
  const documentsPath = app.getPath('documents')
  return join(documentsPath, getLogDirectoryName())
}

async function ensureLogsDirectory(): Promise<string> {
  const logsDir = getLogsDirectory()

  try {
    await access(logsDir, constants.F_OK)
  } catch {
    await mkdir(logsDir, { recursive: true })
  }

  return logsDir
}

async function getLogFilePath(): Promise<string> {
  const logsDir = await ensureLogsDirectory()
  const fileName = getLogFileName()
  return join(logsDir, fileName)
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function ensureCsvHeader(filePath: string): Promise<void> {
  const exists = await fileExists(filePath)

  if (!exists) {
    const header = getCsvHeader() + '\n'
    await appendFile(filePath, header, 'utf-8')
  }
}

function groupResults(results: SearchResult[]): Map<string, Map<string, number[]>> {
  const grouped = new Map<string, Map<string, number[]>>()

  for (const result of results) {
    if (!grouped.has(result.cpf)) {
      grouped.set(result.cpf, new Map())
    }

    const fileMap = grouped.get(result.cpf)!
    if (!fileMap.has(result.filePath)) {
      fileMap.set(result.filePath, [])
    }

    fileMap.get(result.filePath)!.push(result.pageNumber)
  }

  return grouped
}

export async function logSearchResults(
  results: SearchResult[],
  searchedCpfs: string[],
  searchedFiles: string[]
): Promise<void> {
  try {
    const logFilePath = await getLogFilePath()
    await ensureCsvHeader(logFilePath)

    const grouped = groupResults(results)

    const lines: string[] = []

    for (const cpf of searchedCpfs) {
      const fileMap = grouped.get(cpf)

      if (fileMap && fileMap.size > 0) {
        for (const [filePath, pages] of fileMap.entries()) {
          const entry = createCsvLogEntry(cpf, filePath, true, pages)
          lines.push(formatCsvRow(entry))
        }
      } else {
        for (const filePath of searchedFiles) {
          const entry = createCsvLogEntry(cpf, filePath, false, [])
          lines.push(formatCsvRow(entry))
        }
      }
    }

    if (lines.length > 0) {
      const content = lines.join('\n') + '\n'
      await appendFile(logFilePath, content, 'utf-8')
    }
  } catch (error) {
    console.error('Error writing to CSV log:', error)
    throw error
  }
}

export async function logSingleResult(
  cpf: string,
  filePath: string,
  found: boolean,
  pages: number[]
): Promise<void> {
  try {
    const logFilePath = await getLogFilePath()
    await ensureCsvHeader(logFilePath)

    const entry = createCsvLogEntry(cpf, filePath, found, pages)
    const line = formatCsvRow(entry) + '\n'

    await appendFile(logFilePath, line, 'utf-8')
  } catch (error) {
    console.error('Error writing to CSV log:', error)
  }
}

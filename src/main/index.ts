import dotenv from 'dotenv'
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { stat, readdir } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import type { SearchConfig, PdfFile, SearchResult, ExcelProcessingResult, DatabaseQueryResult } from '../types'
import { processPdfFiles } from './pdf-processor'
import { logSearchResults, getLogsDirectory } from './csv-logger'
import { processExcelFile, getSupportedExcelExtensions } from '../utils/excel'
import { queryNotFoundCpfs, testMssqlConnection, closeMssqlPool } from './db/mssql'

dotenv.config()

let isProcessing = false
let shouldCancel = false

async function getPdfFilesFromDirectory(dirPath: string): Promise<PdfFile[]> {
  const pdfFiles: PdfFile[] = []

  async function scanDirectory(currentPath: string): Promise<void> {
    try {
      const entries = await readdir(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name)

        if (entry.isDirectory()) {
          await scanDirectory(fullPath)
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
          const stats = await stat(fullPath)
          pdfFiles.push({
            path: fullPath,
            name: entry.name,
            size: stats.size
          })
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentPath}:`, error)
    }
  }

  await scanDirectory(dirPath)
  return pdfFiles
}

function setupIpcHandlers(): void {
  ipcMain.handle('select-files', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })

    if (result.canceled) return []

    const files: PdfFile[] = []
    for (const filePath of result.filePaths) {
      const stats = await stat(filePath)
      files.push({
        path: filePath,
        name: filePath.split(/[\\/]/).pop() || filePath,
        size: stats.size
      })
    }

    return files
  })

  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) return []

    const dirPath = result.filePaths[0]
    return await getPdfFilesFromDirectory(dirPath)
  })

  ipcMain.on('process-pdfs', async (event, config: SearchConfig) => {
    if (isProcessing) {
      event.reply('processing-error', 'Processing already in progress')
      return
    }

    isProcessing = true
    shouldCancel = false

    const allResults: SearchResult[] = []

    try {
      event.reply('processing-started')

      await processPdfFiles(
        config,
        (current, total, fileName) => {
          if (shouldCancel) {
            throw new Error('Processing cancelled')
          }
          event.reply('processing-progress', {
            processedFiles: current,
            totalFiles: total,
            currentFile: fileName
          })
        },
        (result) => {
          allResults.push(result)
          event.reply('processing-result', result)
        },
        (filePath, error) => {
          event.reply('processing-file-error', { filePath, error: error.message })
        }
      )

      const searchedFiles = config.files.map((f) => f.path)
      await logSearchResults(allResults, config.cpfs, searchedFiles)

      event.reply('processing-complete', allResults)
    } catch (error: any) {
      if (error.message === 'Processing cancelled') {
        event.reply('processing-cancelled')
      } else {
        event.reply('processing-error', error.message)
      }
    } finally {
      isProcessing = false
      shouldCancel = false
    }
  })

  ipcMain.on('cancel-processing', () => {
    shouldCancel = true
  })

  ipcMain.handle('get-logs-directory', () => {
    return getLogsDirectory()
  })

  ipcMain.on('open-logs-directory', () => {
    shell.openPath(getLogsDirectory())
  })

  ipcMain.on('open-pdf-at-page', (_, filePath: string) => {
    shell.openPath(filePath)
  })

  ipcMain.handle('select-excel-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Excel/CSV Files',
          extensions: getSupportedExcelExtensions()
        }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  ipcMain.handle('process-excel-file', async (_, filePath: string): Promise<ExcelProcessingResult> => {
    try {
      console.log(`[Main] Processing Excel file: ${filePath}`)
      const result = await processExcelFile(filePath)
      console.log(
        `[Main] Excel processing complete: ${result.cpfs.length} CPFs from ${result.prodespRecords} PRODESP records`
      )
      return result
    } catch (error: any) {
      console.error(`[Main] Error processing Excel file:`, error)
      throw new Error(`Erro ao processar arquivo: ${error.message}`)
    }
  })

  ipcMain.handle('query-not-found-cpfs', async (_, cpfs: string[]): Promise<DatabaseQueryResult> => {
    try {
      console.log(`[Main] Querying MSSQL for ${cpfs.length} not found CPFs`)
      const result = await queryNotFoundCpfs(cpfs)
      console.log(
        `[Main] MSSQL query complete: ${Object.keys(result.data).length} records found`
      )
      return result
    } catch (error: any) {
      console.error(`[Main] Error querying MSSQL:`, error)
      return {
        success: false,
        data: {},
        errors: [error.message || 'Erro desconhecido ao consultar MSSQL']
      }
    }
  })

  ipcMain.handle('test-database-connection', async (): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('[Main] Testing MSSQL connection...')
      const result = await testMssqlConnection()
      console.log(`[Main] MSSQL test result: ${result.message}`)
      return result
    } catch (error: any) {
      console.error('[Main] Error testing MSSQL:', error)
      return {
        success: false,
        message: error.message || 'Erro ao testar conexão'
      }
    }
  })
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupIpcHandlers()

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  console.log('[Main] Closing MSSQL connection pool...')
  await closeMssqlPool()
})

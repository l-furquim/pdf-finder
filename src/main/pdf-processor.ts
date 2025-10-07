import { readFile } from 'fs/promises'
import type { SearchConfig, SearchResult } from '../types'
import { extractDigits, searchCpfInText, generateCpfVariations } from '../utils/cpf'

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs')

export async function processPdfFile(
  filePath: string,
  cpfs: string[]
): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  let pdfDocument: any = null

  try {
    const dataBuffer = await readFile(filePath)

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(dataBuffer),
      standardFontDataUrl: 'pdfjs-dist/standard_fonts/',
      isEvalSupported: false,
      useSystemFonts: true
    })

    pdfDocument = await loadingTask.promise
    const numPages = pdfDocument.numPages

    console.log(`[PDF Processor] Processing ${filePath}: ${numPages} pages`)

    const foundOnPage = new Set<string>()

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      foundOnPage.clear()
      
      try {
        const page = await pdfDocument.getPage(pageNum)
        const textContent = await page.getTextContent()

        const pageText = textContent.items
          .map((item: any) => {
            if ('str' in item) {
              return item.str
            }
            return ''
          })
          .filter((str: string) => str.length > 0)
          .join(' ')

        const pageDigits = extractDigits(pageText)

        for (const cpf of cpfs) {
          if (foundOnPage.has(cpf)) {
            continue
          }

          const cpfVariations = generateCpfVariations(cpf)
          let cpfFound = false

          for (const variation of cpfVariations) {
            if (pageDigits.includes(variation)) {
              const matches = searchCpfInText(pageText, cpf, 80)

              if (matches.length > 0) {
                const snippet = matches[0].snippet
                results.push({
                  cpf,
                  filePath,
                  fileName: filePath.split(/[\\/]/).pop() || filePath,
                  pageNumber: pageNum,
                  snippet: snippet.replace(/\s+/g, ' ').trim(),
                  timestamp: new Date()
                })

                foundOnPage.add(cpf)
                cpfFound = true
                console.log(`[PDF Processor] ✓ Found CPF ${cpf} (variation: ${variation}) on page ${pageNum} of ${filePath.split(/[\\/]/).pop()}`)
                break
              }
            }
          }

          if (!cpfFound) {
            for (const variation of cpfVariations) {
              if (pageDigits.includes(variation)) {
                results.push({
                  cpf,
                  filePath,
                  fileName: filePath.split(/[\\/]/).pop() || filePath,
                  pageNumber: pageNum,
                  snippet: `Encontrado: ${variation}`,
                  timestamp: new Date()
                })

                foundOnPage.add(cpf)
                console.log(`[PDF Processor] ✓ Found CPF ${cpf} (variation: ${variation}) on page ${pageNum} of ${filePath.split(/[\\/]/).pop()}`)
                break
              }
            }
          }
        }

        page.cleanup()
      } catch (pageError) {
        console.error(`[PDF Processor] Error processing page ${pageNum} of ${filePath}:`, pageError)
      }
    }

    console.log(`[PDF Processor] Completed ${filePath}: Found ${results.length} matches`)
  } catch (error) {
    console.error(`[PDF Processor] Error processing PDF ${filePath}:`, error)
    throw error
  } finally {
    if (pdfDocument) {
      try {
        await pdfDocument.cleanup()
        await pdfDocument.destroy()
      } catch (cleanupError) {
        console.error('[PDF Processor] Error during cleanup:', cleanupError)
      }
    }
  }

  return results
}

export async function processPdfFiles(
  config: SearchConfig,
  onProgress?: (current: number, total: number, fileName: string) => void,
  onResult?: (result: SearchResult) => void,
  onError?: (filePath: string, error: Error) => void
): Promise<SearchResult[]> {
  const allResults: SearchResult[] = []
  const { files, cpfs } = config
  const totalFiles = files.length

  console.log(`[PDF Processor] Starting batch processing: ${totalFiles} files, ${cpfs.length} CPFs`)

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i]

    try {
      onProgress?.(i + 1, totalFiles, file.name)
      console.log(`[PDF Processor] [${i + 1}/${totalFiles}] Processing: ${file.name}`)

      const results = await processPdfFile(file.path, cpfs)

      for (const result of results) {
        onResult?.(result)
        allResults.push(result)
      }

      if (results.length > 0) {
        console.log(`[PDF Processor] ${file.name}: ${results.length} match(es) found`)
      }

    } catch (error) {
      console.error(`[PDF Processor] Failed to process ${file.path}:`, error)
      onError?.(file.path, error as Error)
    }
  }

  console.log(`[PDF Processor] Batch complete: ${allResults.length} total matches across ${totalFiles} files`)

  return allResults
}

import { useState, useEffect } from 'react'
import { FileSearch } from 'lucide-react'
import { CpfInput } from './components/CpfInput'
import { FileUploadArea } from './components/FileUploadArea'
import { ResultsTable } from './components/ResultsTable'
import { SearchControls, ProcessingStatus } from './components/SearchControls'
import type { PdfFile, SearchResult, ProcessingProgress } from '../../types'

function App() {
  const [cpfs, setCpfs] = useState<string[]>([])
  const [permissiveMode, setPermissiveMode] = useState(false)
  const [files, setFiles] = useState<PdfFile[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ProcessingProgress | undefined>()

  const canStart = cpfs.length > 0 && files.length > 0 && !isProcessing

  const handleStartSearch = () => {
    if (!canStart) return

    setIsProcessing(true)
    setResults([])
    setProgress(undefined)

    window.api.processPdfs({
      cpfs,
      files,
      permissiveMode
    })
  }

  const handleCancelSearch = () => {
    window.api.cancelProcessing()
  }

  const handleClearResults = () => {
    setResults([])
  }

  const handleOpenLogs = () => {
    window.api.openLogsDirectory()
  }

  useEffect(() => {
    const unsubscribeStarted = window.api.onProcessingStarted(() => {
      setIsProcessing(true)
    })

    const unsubscribeProgress = window.api.onProcessingProgress((progressData) => {
      setProgress(progressData)
    })

    const unsubscribeResult = window.api.onProcessingResult((result) => {
      setResults((prev) => [...prev, result])
    })

    const unsubscribeComplete = window.api.onProcessingComplete(() => {
      setIsProcessing(false)
      setProgress(undefined)
    })

    const unsubscribeError = window.api.onProcessingError((error) => {
      console.error('Processing error:', error)
      setIsProcessing(false)
      setProgress(undefined)
      alert(`Erro durante o processamento: ${error}`)
    })

    const unsubscribeCancelled = window.api.onProcessingCancelled(() => {
      setIsProcessing(false)
      setProgress(undefined)
    })

    const unsubscribeFileError = window.api.onProcessingFileError(({ filePath, error }) => {
      console.error(`Error processing ${filePath}:`, error)
    })

    return () => {
      unsubscribeStarted()
      unsubscribeProgress()
      unsubscribeResult()
      unsubscribeComplete()
      unsubscribeError()
      unsubscribeCancelled()
      unsubscribeFileError()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600">
              <FileSearch className="size-7 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-slate-900">PDF Finder</h1>
              <p className="text-slate-600 text-sm">Busca de CPFs em documentos PDF</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Configuration Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <CpfInput
                cpfs={cpfs}
                onChange={setCpfs}
                permissiveMode={permissiveMode}
                onPermissiveModeChange={setPermissiveMode}
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <FileUploadArea files={files} onChange={setFiles} />
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SearchControls
              isProcessing={isProcessing}
              hasResults={results.length > 0}
              canStart={canStart}
              onStart={handleStartSearch}
              onCancel={handleCancelSearch}
              onClear={handleClearResults}
              onOpenLogs={handleOpenLogs}
            />
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <ProcessingStatus isProcessing={isProcessing} progress={progress} />
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <ResultsTable results={results} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App

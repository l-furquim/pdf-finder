import { Play, Square, RotateCcw, FolderOpen, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import type { ProcessingProgress } from '../../../types'

interface SearchControlsProps {
  isProcessing: boolean
  hasResults: boolean
  canStart: boolean
  onStart: () => void
  onCancel: () => void
  onClear: () => void
  onOpenLogs: () => void
}

export function SearchControls({
  isProcessing,
  hasResults,
  canStart,
  onStart,
  onCancel,
  onClear,
  onOpenLogs
}: SearchControlsProps) {
  return (
    <div className="flex items-center gap-3">
      {!isProcessing ? (
        <>
          <Button
            onClick={onStart}
            disabled={!canStart}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300"
          >
            <Play className="size-5" />
            Iniciar Busca
          </Button>

          {hasResults && (
            <Button onClick={onClear} variant="outline" size="lg">
              <RotateCcw className="size-5" />
              Limpar Resultados
            </Button>
          )}
        </>
      ) : (
        <Button onClick={onCancel} variant="destructive" size="lg">
          <Square className="size-5" />
          Cancelar
        </Button>
      )}

      <Button onClick={onOpenLogs} variant="outline" size="lg" className="ml-auto">
        <FolderOpen className="size-5" />
        Abrir Logs
      </Button>
    </div>
  )
}

interface ProcessingStatusProps {
  isProcessing: boolean
  progress?: ProcessingProgress
}

export function ProcessingStatus({ isProcessing, progress }: ProcessingStatusProps) {
  if (!isProcessing) return null

  const percentage = progress
    ? Math.round((progress.processedFiles / progress.totalFiles) * 100)
    : 0

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
      <div className="mb-3 flex items-center gap-3">
        <Loader2 className="size-5 animate-spin text-indigo-600" />
        <div className="flex-1">
          <p className="font-medium text-indigo-900 text-sm">Processando arquivos...</p>
          {progress && (
            <p className="text-indigo-700 text-xs">
              {progress.processedFiles} de {progress.totalFiles} • {progress.currentFile}
            </p>
          )}
        </div>
        <span className="font-bold text-indigo-600 text-lg">{percentage}%</span>
      </div>

      {progress && (
        <div className="h-2 overflow-hidden rounded-full bg-indigo-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}

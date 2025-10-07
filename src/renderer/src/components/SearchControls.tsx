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
    <div 
      className="fixed bottom-6 right-6 z-50 w-96 transition-all duration-300 ease-out"
      style={{
        animation: 'slideInUp 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="rounded-lg border border-indigo-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <Loader2 className="size-5 animate-spin text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">Processando arquivos</p>
            {progress && (
              <p className="truncate text-slate-600 text-xs" title={progress.currentFile}>
                {progress.currentFile}
              </p>
            )}
          </div>
          <span className="font-bold text-indigo-600 text-xl tabular-nums">{percentage}%</span>
        </div>

        {progress && (
          <>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-center text-slate-500 text-xs">
              {progress.processedFiles} de {progress.totalFiles} arquivos
            </p>
          </>
        )}
      </div>
    </div>
  )
}

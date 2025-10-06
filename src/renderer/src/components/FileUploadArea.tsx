import { FileText, FolderOpen, X } from 'lucide-react'
import { Button } from './ui/button'
import type { PdfFile } from '../../../types'

interface FileUploadAreaProps {
  files: PdfFile[]
  onChange: (files: PdfFile[]) => void
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export function FileUploadArea({ files, onChange }: FileUploadAreaProps) {
  const handleSelectFiles = async () => {
    const selectedFiles = await window.api.selectFiles()
    if (selectedFiles.length > 0) {
      onChange([...files, ...selectedFiles])
    }
  }

  const handleSelectDirectory = async () => {
    const selectedFiles = await window.api.selectDirectory()
    if (selectedFiles.length > 0) {
      onChange([...files, ...selectedFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
  }

  const handleClearAll = () => {
    onChange([])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg text-slate-900">Arquivos PDF</h2>
        {files.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll} className="text-xs">
            Limpar todos
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSelectFiles}
          variant="outline"
          className="flex-1 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
        >
          <FileText className="size-5" />
          Selecionar Arquivos
        </Button>

        <Button
          onClick={handleSelectDirectory}
          variant="outline"
          className="flex-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          <FolderOpen className="size-5" />
          Selecionar Pasta
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-200">
            <FileText className="size-8 text-slate-500" />
          </div>
          <p className="mb-2 font-medium text-slate-700">Nenhum arquivo selecionado</p>
          <p className="text-slate-500 text-sm">
            Selecione arquivos PDF individuais ou uma pasta contendo PDFs
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="font-medium text-sm text-slate-700">
              {files.length} arquivo{files.length !== 1 ? 's' : ''} selecionado
              {files.length !== 1 ? 's' : ''} •{' '}
              {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
            </p>
          </div>

          <div className="max-h-[300px] divide-y divide-slate-100 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={`${file.path}-${index}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
                    <FileText className="size-5 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm text-slate-900" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-slate-500 text-xs">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveFile(index)}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

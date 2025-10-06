import { useState, useMemo } from 'react'
import { FileText, ExternalLink, Search } from 'lucide-react'
import { Button } from './ui/button'
import type { SearchResult } from '../../../types'
import { formatCpf } from '../../../utils/cpf'

interface ResultsTableProps {
  results: SearchResult[]
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [filterCpf, setFilterCpf] = useState('')
  const [filterFile, setFilterFile] = useState('')

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const matchesCpf = !filterCpf || result.cpf.includes(filterCpf.replace(/\D/g, ''))
      const matchesFile =
        !filterFile || result.fileName.toLowerCase().includes(filterFile.toLowerCase())
      return matchesCpf && matchesFile
    })
  }, [results, filterCpf, filterFile])

  const handleOpenPdf = (filePath: string, pageNumber: number) => {
    window.api.openPdfAtPage(filePath, pageNumber)
  }

  if (results.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-200">
          <Search className="size-8 text-slate-500" />
        </div>
        <p className="mb-2 font-medium text-slate-700">Nenhum resultado encontrado</p>
        <p className="text-slate-500 text-sm">
          Configure a busca e clique em "Iniciar Busca" para começar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg text-slate-900">
          Resultados
          <span className="ml-2 rounded-full bg-indigo-100 px-2.5 py-1 font-medium text-indigo-700 text-sm">
            {filteredResults.length}
          </span>
        </h2>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Filtrar por CPF..."
            value={filterCpf}
            onChange={(e) => setFilterCpf(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="Filtrar por arquivo..."
            value={filterFile}
            onChange={(e) => setFilterFile(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {/* Results List */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="font-medium text-slate-700 text-sm">
            Mostrando {filteredResults.length} de {results.length} resultado
            {results.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="max-h-[500px] divide-y divide-slate-100 overflow-y-auto">
          {filteredResults.map((result, index) => (
            <div
              key={`${result.cpf}-${result.filePath}-${result.pageNumber}-${index}`}
              className="flex items-center gap-4 px-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <FileText className="size-5 text-red-600" />
              </div>

              <div className="min-w-0 flex-1 space-y-1 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-indigo-600 text-sm">
                    {formatCpf(result.cpf)}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="truncate text-slate-600 text-sm" title={result.fileName}>
                    {result.fileName}
                  </span>
                  <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-700 text-xs">
                    Página {result.pageNumber}
                  </span>
                </div>
                <p className="truncate text-slate-500 text-xs" title={result.snippet}>
                  {result.snippet}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenPdf(result.filePath, result.pageNumber)}
                className="shrink-0"
              >
                <ExternalLink className="size-3.5" />
                Abrir
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

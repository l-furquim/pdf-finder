import { useState, useMemo } from 'react'
import { FileText, ExternalLink, Search, CheckCircle2, XCircle, Download, FileSpreadsheet, FileType } from 'lucide-react'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from './ui/table'
import type { SearchResult, EmployeeData } from '../../../types'
import { formatCpf } from '../../../utils/cpf'
import {
  exportFoundToCSV,
  exportFoundToXLSX,
  exportNotFoundToCSV,
  exportNotFoundToXLSX,
  exportFoundCPFsToTXT,
  exportCPFsToTXT,
  exportNotFoundWithDatabaseToCSV,
  exportNotFoundWithDatabaseToXLSX,
  downloadFile,
  generateTimestampedFilename
} from '../../../utils/export'

interface ResultsTableProps {
  results: SearchResult[]
  searchedCpfs: string[]
  databaseData: Record<string, EmployeeData>
  isLoadingDatabase: boolean
}

export function ResultsTable({ results, searchedCpfs, databaseData, isLoadingDatabase }: ResultsTableProps) {
  const [filterCpf, setFilterCpf] = useState('')
  const [filterFile, setFilterFile] = useState('')
  const [activeTab, setActiveTab] = useState<'found' | 'not-found'>('found')

  // Identify which CPFs were found and which were not
  const foundCpfs = useMemo(() => {
    return new Set(results.map((r) => r.cpf))
  }, [results])

  const notFoundCpfs = useMemo(() => {
    return searchedCpfs.filter((cpf) => !foundCpfs.has(cpf))
  }, [searchedCpfs, foundCpfs])

  // Filter found results
  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const matchesCpf = !filterCpf || result.cpf.includes(filterCpf.replace(/\D/g, ''))
      const matchesFile =
        !filterFile || result.fileName.toLowerCase().includes(filterFile.toLowerCase())
      return matchesCpf && matchesFile
    })
  }, [results, filterCpf, filterFile])

  // Filter not found CPFs
  const filteredNotFoundCpfs = useMemo(() => {
    if (!filterCpf) return notFoundCpfs
    return notFoundCpfs.filter((cpf) => cpf.includes(filterCpf.replace(/\D/g, '')))
  }, [notFoundCpfs, filterCpf])

  const handleOpenPdf = (filePath: string, pageNumber: number) => {
    window.api.openPdfAtPage(filePath, pageNumber)
  }

  const handleExportFoundCSV = () => {
    const csv = exportFoundToCSV(filteredResults)
    const filename = generateTimestampedFilename('cpfs_encontrados', 'csv')
    downloadFile(csv, filename, 'text/csv;charset=utf-8;')
  }

  const handleExportFoundXLSX = () => {
    const xlsx = exportFoundToXLSX(filteredResults)
    const filename = generateTimestampedFilename('cpfs_encontrados', 'xlsx')
    downloadFile(xlsx, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }

  const handleExportFoundTXT = () => {
    const txt = exportFoundCPFsToTXT(filteredResults, false)
    const filename = generateTimestampedFilename('cpfs_encontrados', 'txt')
    downloadFile(txt, filename, 'text/plain;charset=utf-8;')
  }

  // Export functions for not found CPFs
  const handleExportNotFoundCSV = () => {
    const hasDatabaseData = Object.keys(databaseData).length > 0
    const csv = hasDatabaseData
      ? exportNotFoundWithDatabaseToCSV(filteredNotFoundCpfs, databaseData)
      : exportNotFoundToCSV(filteredNotFoundCpfs)
    const filename = generateTimestampedFilename('cpfs_nao_encontrados', 'csv')
    downloadFile(csv, filename, 'text/csv;charset=utf-8;')
  }

  const handleExportNotFoundXLSX = () => {
    const hasDatabaseData = Object.keys(databaseData).length > 0
    const xlsx = hasDatabaseData
      ? exportNotFoundWithDatabaseToXLSX(filteredNotFoundCpfs, databaseData)
      : exportNotFoundToXLSX(filteredNotFoundCpfs)
    const filename = generateTimestampedFilename('cpfs_nao_encontrados', 'xlsx')
    downloadFile(xlsx, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }

  const handleExportNotFoundTXT = () => {
    const txt = exportCPFsToTXT(filteredNotFoundCpfs, false)
    const filename = generateTimestampedFilename('cpfs_nao_encontrados', 'txt')
    downloadFile(txt, filename, 'text/plain;charset=utf-8;')
  }

  if (searchedCpfs.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-200">
          <Search className="size-8 text-slate-500" />
        </div>
        <p className="mb-2 font-medium text-slate-700">Nenhuma busca realizada</p>
        <p className="text-slate-500 text-sm">
          Configure a busca e clique em "Iniciar Busca" para começar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg text-slate-900">Resultados da Busca</h2>
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
        {activeTab === 'found' && (
          <div className="flex-1">
            <input
              type="text"
              placeholder="Filtrar por arquivo..."
              value={filterFile}
              onChange={(e) => setFilterFile(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="found"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'found' | 'not-found')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="found" className="gap-2">
            <CheckCircle2 className="size-4" />
            Encontrados
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
              {foundCpfs.size}
            </span>
          </TabsTrigger>
          <TabsTrigger value="not-found" className="gap-2">
            <XCircle className="size-4" />
            Não Encontrados
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
              {notFoundCpfs.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Found CPFs Tab */}
        <TabsContent value="found" className="mt-4">
          {filteredResults.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">Nenhum CPF encontrado nos documentos</p>
            </div>
          ) : (
            <>
              {/* Export buttons */}
              <div className="mb-3 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={handleExportFoundCSV} className="gap-2">
                  <Download className="size-4" />
                  Exportar CSV
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportFoundXLSX} className="gap-2">
                  <FileSpreadsheet className="size-4" />
                  Exportar Excel
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportFoundTXT} className="gap-2">
                  <FileType className="size-4" />
                  Exportar TXT (CPFs)
                </Button>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">CPF</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead className="w-[100px]">Página</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result, index) => (
                    <TableRow key={`${result.cpf}-${result.filePath}-${result.pageNumber}-${index}`}>
                      <TableCell className="font-mono font-medium text-indigo-600">
                        {formatCpf(result.cpf)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                            <FileText className="size-4 text-red-600" />
                          </div>
                          <span className="truncate text-sm" title={result.fileName}>
                            {result.fileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                          Pág. {result.pageNumber}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPdf(result.filePath, result.pageNumber)}
                        >
                          <ExternalLink className="size-3.5" />
                          Abrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-slate-600 text-sm">
                  Mostrando {filteredResults.length} de {results.length} ocorrência
                  {results.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            </>
          )}
        </TabsContent>

        {/* Not Found CPFs Tab */}
        <TabsContent value="not-found" className="mt-4">
          {filteredNotFoundCpfs.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">
                {notFoundCpfs.length === 0
                  ? 'Todos os CPFs foram encontrados! 🎉'
                  : 'Nenhum CPF corresponde ao filtro'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={handleExportNotFoundCSV} className="gap-2">
                  <Download className="size-4" />
                  Exportar CSV
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportNotFoundXLSX} className="gap-2">
                  <FileSpreadsheet className="size-4" />
                  Exportar Excel
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportNotFoundTXT} className="gap-2">
                  <FileType className="size-4" />
                  Exportar TXT (CPFs)
                </Button>
              </div>

              {isLoadingDatabase && (
                <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-center text-sm text-blue-800">
                  Consultando dados no banco de dados...
                </div>
              )}

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CPF</TableHead>
                    {Object.keys(databaseData).length > 0 ? (
                      <>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Nome</TableHead>
                      </>
                    ) : (
                      <TableHead className="text-right">Status</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotFoundCpfs.map((cpf) => {
                    const data = databaseData[cpf]
                    return (
                      <TableRow key={cpf}>
                        <TableCell className="font-mono font-medium text-slate-700">
                          {formatCpf(cpf)}
                        </TableCell>
                        {Object.keys(databaseData).length > 0 ? (
                          <>
                            <TableCell className="text-slate-700">
                              {data ? data.MATRICULA : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-700">
                              {data ? data.NOME : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </TableCell>
                          </>
                        ) : (
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                              <XCircle className="size-3" />
                              Não encontrado
                            </span>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-600 text-sm">
                    {filteredNotFoundCpfs.length} CPF{filteredNotFoundCpfs.length !== 1 ? 's' : ''} não
                    encontrado{filteredNotFoundCpfs.length !== 1 ? 's' : ''}
                    {Object.keys(databaseData).length > 0 && (
                      <> · {Object.keys(databaseData).length} com dados do banco</>
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

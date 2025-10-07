import { useState, useEffect } from 'react'
import { X, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { Button } from './ui/button'
import { parseCpfList, formatCpf } from '../../../utils/cpf'

interface CpfInputProps {
  cpfs: string[]
  onChange: (cpfs: string[]) => void
}

export function CpfInput({ cpfs, onChange }: CpfInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoadingExcel, setIsLoadingExcel] = useState(false)

  const handleAddCpfs = () => {
    if (!inputValue.trim()) return

    try {
      const newCpfs = parseCpfList(inputValue)

      if (newCpfs.length === 0) {
        setError('Nenhum CPF válido encontrado')
        return
      }

      const allCpfs = Array.from(new Set([...cpfs, ...newCpfs]))
      onChange(allCpfs)
      setInputValue('')
      setError(null)
    } catch (err) {
      setError('Erro ao processar CPFs')
    }
  }

  const handleRemoveCpf = (cpfToRemove: string) => {
    onChange(cpfs.filter((cpf) => cpf !== cpfToRemove))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const newCpfs = parseCpfList(text)

      if (newCpfs.length === 0) {
        setError('Nenhum CPF válido encontrado no arquivo')
        return
      }

      const allCpfs = Array.from(new Set([...cpfs, ...newCpfs]))
      onChange(allCpfs)
      setError(null)
    } catch (err) {
      setError('Erro ao ler arquivo')
    }

    event.target.value = ''
  }

  const handleExcelFileUpload = async () => {
    try {
      setIsLoadingExcel(true)
      setError(null)

      // Open file dialog
      const filePath = await window.api.selectExcelFile()

      if (!filePath) {
        setIsLoadingExcel(false)
        return
      }

      // Process the Excel file
      const result = await window.api.processExcelFile(filePath)

      if (result.cpfs.length === 0) {
        setError(
          `Nenhum CPF encontrado. Total de registros: ${result.totalRecords}, Registros PRODESP: ${result.prodespRecords}`
        )
        setIsLoadingExcel(false)
        return
      }

      // Add extracted CPFs
      const allCpfs = Array.from(new Set([...cpfs, ...result.cpfs]))
      onChange(allCpfs)

      // Show success message
      setError(null)
      alert(
        `✓ ${result.cpfs.length} CPFs extraídos com sucesso!\n\n` +
        `Arquivo: ${result.fileName}\n` +
        `Total de registros: ${result.totalRecords}\n` +
        `Registros PRODESP: ${result.prodespRecords}\n` +
        `CPFs únicos: ${result.cpfs.length}`
      )

      setIsLoadingExcel(false)
    } catch (err: any) {
      setError(`Erro ao processar planilha: ${err.message || 'Erro desconhecido'}`)
      setIsLoadingExcel(false)
    }
  }

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [error])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg text-slate-900">CPFs para Buscar</h2>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite CPFs separados por vírgula, ponto-e-vírgula ou quebra de linha..."
            className="min-h-[100px] flex-1 rounded-lg border border-slate-300 p-3 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleAddCpfs} className="bg-indigo-600 hover:bg-indigo-700">
            Adicionar CPFs
          </Button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            <Upload className="size-4" />
            Carregar TXT
            <input
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <Button
            onClick={handleExcelFileUpload}
            disabled={isLoadingExcel}
            variant="outline"
            className="gap-2"
          >
            <FileSpreadsheet className="size-4" />
            {isLoadingExcel ? 'Processando...' : 'Carregar Excel'}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {cpfs.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium text-sm text-slate-700">
              {cpfs.length} CPF{cpfs.length !== 1 ? 's' : ''} adicionado{cpfs.length !== 1 ? 's' : ''}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange([])}
              className="text-xs"
            >
              Limpar todos
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cpfs.map((cpf) => (
              <div
                key={cpf}
                className="flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm shadow-sm"
              >
                <span className="font-mono text-slate-900">{formatCpf(cpf)}</span>
                <button
                  onClick={() => handleRemoveCpf(cpf)}
                  className="text-slate-400 transition-colors hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

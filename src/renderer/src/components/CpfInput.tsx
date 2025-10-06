import { useState, useEffect } from 'react'
import { X, Upload, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { parseCpfList, formatCpf } from '../../../utils/cpf'

interface CpfInputProps {
  cpfs: string[]
  onChange: (cpfs: string[]) => void
  permissiveMode: boolean
  onPermissiveModeChange: (enabled: boolean) => void
}

export function CpfInput({ cpfs, onChange, permissiveMode, onPermissiveModeChange }: CpfInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleAddCpfs = () => {
    if (!inputValue.trim()) return

    try {
      const newCpfs = parseCpfList(inputValue, permissiveMode)

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
      const newCpfs = parseCpfList(text, permissiveMode)

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
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={permissiveMode}
              onChange={(e) => onPermissiveModeChange(e.target.checked)}
              className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-700">Modo Permissivo</span>
          </label>
        </div>
      </div>

      {permissiveMode && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <p>
            Modo permissivo ativado: CPFs com menos de 11 dígitos serão preenchidos com zeros à
            esquerda. Isso pode gerar falsos positivos.
          </p>
        </div>
      )}

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
            Carregar de arquivo
            <input
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
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

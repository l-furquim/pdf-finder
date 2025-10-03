import React, { useState } from 'react';

interface CpfInputProps {
  cpfList: string[];
  onCpfListChange: (cpfList: string[]) => void;
  permissiveMode: boolean;
  onPermissiveModeChange: (mode: boolean) => void;
}

export const CpfInput: React.FC<CpfInputProps> = ({
  cpfList,
  onCpfListChange,
  permissiveMode,
  onPermissiveModeChange,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleAddCpfs = () => {
    const lines = inputValue
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const newCpfs = [...new Set([...cpfList, ...lines])];
    onCpfListChange(newCpfs);
    setInputValue('');
  };

  const handleRemoveCpf = (index: number) => {
    const newCpfs = cpfList.filter((_, i) => i !== index);
    onCpfListChange(newCpfs);
  };

  const handleClearAll = () => {
    onCpfListChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title">CPFs para Busca</h3>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Digite os CPFs (um por linha)</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24"
              placeholder="00245678910&#10;123.456.789-10&#10;98765432100"
              value={inputValue}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={permissiveMode}
                onChange={(e) => onPermissiveModeChange(e.target.checked)}
              />
              <span className="label-text">
                Modo Permissivo (preencher CPFs com menos de 11 dígitos com zeros à esquerda)
              </span>
            </label>
          </div>

          <div className="card-actions justify-end">
            <button
              onClick={handleAddCpfs}
              className="btn btn-primary"
              disabled={!inputValue.trim()}
            >
              Adicionar CPFs
            </button>
          </div>
        </div>
      </div>

      {cpfList.length > 0 && (
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h3 className="card-title">CPFs Adicionados ({cpfList.length})</h3>
              <button onClick={handleClearAll} className="btn btn-ghost btn-sm">
                Limpar Todos
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {cpfList.map((cpf, index) => (
                <div key={index} className="badge badge-lg badge-primary gap-2">
                  <span>{cpf}</span>
                  <button
                    onClick={() => handleRemoveCpf(index)}
                    className="btn btn-ghost btn-xs btn-circle"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-3 h-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

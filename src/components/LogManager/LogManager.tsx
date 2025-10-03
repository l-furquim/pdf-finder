import React, { useState } from 'react';

interface LogManagerProps {
  resultsCount: number;
  isProcessing: boolean;
}

export const LogManager: React.FC<LogManagerProps> = ({ resultsCount, isProcessing }) => {
  const [logStatus, setLogStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleOpenLogFolder = async () => {
    try {
      await window.electronAPI.openLogFolder();
    } catch (error) {
      console.error('Error opening log folder:', error);
    }
  };

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="card-title text-sm">Logs CSV</h3>
            <p className="text-xs text-base-content/60">
              Os resultados são salvos automaticamente em Documents/leitor_documentos
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {logStatus === 'saved' && (
              <div className="flex items-center gap-2 text-success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">Salvo</span>
              </div>
            )}
            
            {logStatus === 'saving' && (
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <span className="text-sm">Salvando...</span>
              </div>
            )}

            {logStatus === 'error' && (
              <div className="flex items-center gap-2 text-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <span className="text-sm">Erro ao salvar</span>
              </div>
            )}

            <button
              onClick={handleOpenLogFolder}
              className="btn btn-sm btn-outline"
              disabled={isProcessing}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                />
              </svg>
              Abrir Pasta de Logs
            </button>
          </div>
        </div>

        {resultsCount > 0 && !isProcessing && (
          <div className="mt-2">
            <div className="stats stats-horizontal bg-base-100 shadow w-full">
              <div className="stat">
                <div className="stat-title">Total de Ocorrências</div>
                <div className="stat-value text-primary">{resultsCount}</div>
                <div className="stat-desc">Encontradas na busca atual</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

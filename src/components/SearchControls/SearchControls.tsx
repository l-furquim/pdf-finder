import React from 'react';
import { ProcessingStatus } from '../../types';

interface SearchControlsProps {
  isProcessing: boolean;
  processingStatus: ProcessingStatus;
  onStartSearch: () => void;
  onCancelSearch: () => void;
  onClearResults: () => void;
  canSearch: boolean;
}

export const SearchControls: React.FC<SearchControlsProps> = ({
  isProcessing,
  processingStatus,
  onStartSearch,
  onCancelSearch,
  onClearResults,
  canSearch,
}) => {
  const progress = processingStatus.total > 0
    ? (processingStatus.processed / processingStatus.total) * 100
    : 0;

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={onStartSearch}
              className={`btn btn-success ${isProcessing ? 'btn-disabled' : ''}`}
              disabled={!canSearch || isProcessing}
            >
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
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              Buscar
            </button>
            
            {isProcessing && (
              <button onClick={onCancelSearch} className="btn btn-error">
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancelar
              </button>
            )}
            
            <button
              onClick={onClearResults}
              className="btn btn-ghost"
              disabled={isProcessing}
            >
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
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
              Limpar
            </button>
          </div>

          {isProcessing && (
            <div className="flex-1 min-w-[200px]">
              <div className="text-sm font-medium mb-1">
                Processando: {processingStatus.processed} / {processingStatus.total}
              </div>
              <progress
                className="progress progress-primary w-full"
                value={progress}
                max="100"
              />
              <div className="text-xs text-base-content/60 mt-1 truncate">
                {processingStatus.currentFile}
              </div>
            </div>
          )}
        </div>

        {!canSearch && !isProcessing && (
          <div className="alert alert-warning">
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
            <span>Selecione arquivos e adicione CPFs para iniciar a busca</span>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { List } from 'react-window';
import { SearchResult } from '../../types';

interface ResultsTableProps {
  results: SearchResult[];
  onOpenPdf: (filePath: string, pageNumber: number) => void;
}

interface RowProps {
  result: SearchResult;
  onOpenPdf: (filePath: string, pageNumber: number) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results, onOpenPdf }) => {
  const formatCpf = (cpf: string): string => {
    if (cpf.length !== 11) return cpf;
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
  };

  if (results.length === 0) {
    return (
      <div className="card bg-base-200">
        <div className="card-body items-center text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-16 h-16 text-base-content/40"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
            />
          </svg>
          <h3 className="text-lg font-medium mt-4">Nenhum resultado encontrado</h3>
          <p className="text-sm text-base-content/60">
            Execute uma busca para ver os resultados aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="card-title">
          Resultados da Busca ({results.length})
        </h3>
        <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
          {results.map((result, index) => (
            <div key={index} className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-2">
                    <div className="text-xs text-base-content/60">CPF</div>
                    <div className="font-mono font-medium">{formatCpf(result.cpf)}</div>
                  </div>
                  
                  <div className="col-span-4">
                    <div className="text-xs text-base-content/60">Arquivo</div>
                    <div className="text-sm truncate" title={result.fileName}>
                      {result.fileName}
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <div className="text-xs text-base-content/60">Página</div>
                    <div className="badge badge-primary">{result.pageNumber}</div>
                  </div>
                  
                  <div className="col-span-4">
                    <div className="text-xs text-base-content/60">Trecho</div>
                    <div className="text-sm truncate" title={result.snippet}>
                      {result.snippet}
                    </div>
                  </div>
                  
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => onOpenPdf(result.filePath, result.pageNumber)}
                      className="btn btn-sm btn-primary"
                      title="Abrir PDF"
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
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

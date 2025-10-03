import React, { useState } from 'react';
import { UploadArea } from './components/UploadArea';
import { CpfInput } from './components/CpfInput';
import { SearchControls } from './components/SearchControls';
import { ResultsTable } from './components/ResultsTable';
import { LogManager } from './components/LogManager';
import { FileItem, SearchResult, ProcessingStatus, LogEntry } from './types';
import { validateCpfList } from './utils/cpf';

export default function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [cpfList, setCpfList] = useState<string[]>([]);
  const [permissiveMode, setPermissiveMode] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    total: 0,
    processed: 0,
    currentFile: '',
    isProcessing: false,
  });

  const handleStartSearch = async () => {
    const { valid: validCpfs, invalid: invalidCpfs } = validateCpfList(cpfList, permissiveMode);

    if (invalidCpfs.length > 0) {
      alert(`CPFs inválidos encontrados: ${invalidCpfs.join(', ')}`);
      return;
    }

    if (validCpfs.length === 0 || files.length === 0) {
      return;
    }

    setIsProcessing(true);
    setResults([]);
    setProcessingStatus({
      total: files.length,
      processed: 0,
      currentFile: '',
      isProcessing: true,
    });

    const allResults: SearchResult[] = [];
    const logEntries: LogEntry[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        setProcessingStatus({
          total: files.length,
          processed: i,
          currentFile: file.name,
          isProcessing: true,
        });

        try {
          const fileResults = await window.electronAPI.processPdf(file.path, validCpfs);
          allResults.push(...fileResults);

          const cpfMap = new Map<string, number[]>();
          fileResults.forEach(result => {
            if (!cpfMap.has(result.cpf)) {
              cpfMap.set(result.cpf, []);
            }
            cpfMap.get(result.cpf)!.push(result.pageNumber);
          });

          validCpfs.forEach(cpf => {
            const pages = cpfMap.get(cpf) || [];
            logEntries.push({
              timestamp: new Date().toISOString(),
              cpf,
              filePath: file.path,
              found: pages.length > 0,
              pages: pages.length > 0 ? pages.sort((a, b) => a - b).join(';') : '',
            });
          });
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
        }
      }

      setResults(allResults);

      if (logEntries.length > 0) {
        await window.electronAPI.writeLog(logEntries);
      }

      setProcessingStatus({
        total: files.length,
        processed: files.length,
        currentFile: '',
        isProcessing: false,
      });
    } catch (error) {
      console.error('Error during search:', error);
      alert('Erro durante a busca. Verifique o console para mais detalhes.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSearch = () => {
    setIsProcessing(false);
    setProcessingStatus({
      total: 0,
      processed: 0,
      currentFile: '',
      isProcessing: false,
    });
  };

  const handleClearResults = () => {
    setResults([]);
    setFiles([]);
    setCpfList([]);
  };

  const handleOpenPdf = async (filePath: string, pageNumber: number) => {
    try {
      await window.electronAPI.openPdfAtPage(filePath, pageNumber);
    } catch (error) {
      console.error('Error opening PDF:', error);
      alert('Erro ao abrir o PDF. Verifique o console para mais detalhes.');
    }
  };

  const canSearch = files.length > 0 && cpfList.length > 0 && !isProcessing;

  return (
    <div className="min-h-screen  bg-base-300 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Leitor de Documentos</h1>
          <p className="text-base-content/60">
            Busca de CPFs em arquivos PDF
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UploadArea files={files} onFilesSelected={setFiles} />
          <CpfInput
            cpfList={cpfList}
            onCpfListChange={setCpfList}
            permissiveMode={permissiveMode}
            onPermissiveModeChange={setPermissiveMode}
          />
        </div>

        <SearchControls
          isProcessing={isProcessing}
          processingStatus={processingStatus}
          onStartSearch={handleStartSearch}
          onCancelSearch={handleCancelSearch}
          onClearResults={handleClearResults}
          canSearch={canSearch}
        />

        <ResultsTable results={results} onOpenPdf={handleOpenPdf} />

        <LogManager resultsCount={results.length} isProcessing={isProcessing} />
      </div>
    </div>
  );
}
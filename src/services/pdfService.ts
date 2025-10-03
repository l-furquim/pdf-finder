import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist';
import { SearchResult } from '../types';
import { searchCpfInText } from '../utils/cpf';

pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.entry');

export const extractTextFromPdf = async (filePath: string): Promise<Map<number, string>> => {
  const data = await fs.promises.readFile(filePath);
  const uint8Array = new Uint8Array(data);

  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  const pageTexts = new Map<number, string>();

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    pageTexts.set(pageNum, pageText);
  }

  return pageTexts;
};

export const searchCpfsInPdf = async (
  filePath: string,
  fileName: string,
  cpfList: string[]
): Promise<SearchResult[]> => {
  const results: SearchResult[] = [];

  try {
    const pageTexts = await extractTextFromPdf(filePath);

    for (const [pageNum, pageText] of pageTexts) {
      for (const cpf of cpfList) {
        const { found, snippet } = searchCpfInText(pageText, cpf);

        if (found) {
          results.push({
            cpf,
            filePath,
            fileName,
            pageNumber: pageNum,
            snippet,
            timestamp: new Date(),
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error processing PDF ${filePath}:`, error);
  }

  return results;
};

export const batchSearchPdfs = async (
  files: { path: string; name: string }[],
  cpfList: string[],
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<SearchResult[]> => {
  const allResults: SearchResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (onProgress) {
      onProgress(i + 1, files.length, file.name);
    }

    const fileResults = await searchCpfsInPdf(file.path, file.name, cpfList);
    allResults.push(...fileResults);
  }

  return allResults;
};

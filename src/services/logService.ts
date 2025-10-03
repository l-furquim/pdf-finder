import * as fs from 'fs';
import * as path from 'path';
import { format as csvFormat } from 'fast-csv';
import { app } from 'electron';
import { LogEntry } from '../types';
import { ensureDirectoryExists } from '../utils/fileUtils';

const getLogDirectory = (): string => {
  const documentsPath = app.getPath('documents');
  return path.join(documentsPath, 'leitor_documentos');
};

const getLogFilePath = (): string => {
  const logDir = getLogDirectory();
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return path.join(logDir, `${dateStr}.csv`);
};

export const writeLogEntries = async (entries: LogEntry[]): Promise<void> => {
  const logDir = getLogDirectory();
  await ensureDirectoryExists(logDir);

  const logFilePath = getLogFilePath();

  const fileExists = fs.existsSync(logFilePath);

  const csvStream = csvFormat({ headers: !fileExists, includeEndRowDelimiter: true });
  const writeStream = fs.createWriteStream(logFilePath, { flags: 'a' });

  return new Promise((resolve, reject) => {
    csvStream.pipe(writeStream);

    csvStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);

    entries.forEach((entry) => {
      csvStream.write({
        timestamp: entry.timestamp,
        cpf: entry.cpf,
        filePath: entry.filePath,
        found: entry.found,
        pages: entry.pages,
      });
    });

    csvStream.end();
  });
};

export const getLogDirectoryPath = (): string => {
  return getLogDirectory();
};

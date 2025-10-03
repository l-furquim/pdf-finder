import * as fs from 'fs';
import * as path from 'path';
import { FileItem } from '../types';

export const getAllPdfFiles = async (dirPath: string): Promise<FileItem[]> => {
  const files: FileItem[] = [];

  const processDirectory = async (dir: string): Promise<void> => {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.pdf') {
        const stats = await fs.promises.stat(fullPath);
        files.push({
          path: fullPath,
          name: entry.name,
          size: stats.size,
        });
      }
    }
  };

  await processDirectory(dirPath);
  return files;
};

export const getFilesFromPaths = async (paths: string[]): Promise<FileItem[]> => {
  const allFiles: FileItem[] = [];

  for (const filePath of paths) {
    const stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      const dirFiles = await getAllPdfFiles(filePath);
      allFiles.push(...dirFiles);
    } else if (stats.isFile() && path.extname(filePath).toLowerCase() === '.pdf') {
      allFiles.push({
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
      });
    }
  }

  return allFiles;
};

export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.promises.access(dirPath);
  } catch {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

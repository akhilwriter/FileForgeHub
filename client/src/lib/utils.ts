import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export const fileTypeIcons: Record<string, string> = {
  pdf: "file-text",
  eml: "mail",
  xlsx: "file-spreadsheet",
  default: "file"
};

export const getFileTypeFromExtension = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  if (extension === 'pdf') return 'pdf';
  if (extension === 'eml') return 'eml';
  if (extension === 'xlsx') return 'xlsx';
  
  return 'default';
};

export const isValidFileType = (file: File, acceptedTypes: string[]): boolean => {
  const fileType = getFileTypeFromExtension(file.name);
  return acceptedTypes.includes(fileType);
};

export function createDownloadFromUrl(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function createDownloadFromBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  createDownloadFromUrl(url, filename);
  window.URL.revokeObjectURL(url);
}

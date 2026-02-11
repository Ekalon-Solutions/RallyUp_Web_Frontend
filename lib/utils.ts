import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatLocalDate } from "@/lib/timezone"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDisplayDate(date: string | Date | null | undefined): string {
  return formatLocalDate(date, "date-short")
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  if (typeof window === 'undefined') return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

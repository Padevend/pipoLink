import { formatBytes } from '@/shared/lib/file';

export function getDocumentSize(size: number): string {
  return formatBytes(size);
}

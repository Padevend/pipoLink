/** Decodes server-upload filenames for display without changing their transport value. */
export function displayFileName(value?: string | null): string {
  if (!value) return 'Document';
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

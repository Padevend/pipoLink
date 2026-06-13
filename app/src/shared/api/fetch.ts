import { request } from './client';

export async function fetchJson<T = any>(path: string, options: Record<string, any> = {}): Promise<T> {
  return request<T>(path, options as RequestInit);
}
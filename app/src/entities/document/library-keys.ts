export const documentKeys = {
  all:    ['documents'] as const,
  list:   (params: unknown) => [...documentKeys.all, 'list', params] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
};

export const libraryKeys = {
  all:    ['library'] as const,
  browse: (parentId: string | null) => [...libraryKeys.all, 'browse', parentId] as const,
  detail: (id: string) => [...libraryKeys.all, 'detail', id] as const,
  mine:   (params?: { page?: number; limit?: number }) =>
    [...libraryKeys.all, 'mine', params ?? {}] as const,
  search: (q: string) => [...libraryKeys.all, 'search', q] as const,
};

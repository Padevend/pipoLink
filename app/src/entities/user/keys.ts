export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  search: (query: string) => [...userKeys.all, 'search', query] as const,
};

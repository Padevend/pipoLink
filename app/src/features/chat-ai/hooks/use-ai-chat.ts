import { useMutation } from '@tanstack/react-query';

import { aiApi } from '@/shared/api/ai';

export function useAiChat() {
  return useMutation({
    mutationFn: async (message: string) => aiApi.sendMessage({ message }),
  });
}

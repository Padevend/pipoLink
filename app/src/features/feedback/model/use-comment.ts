import { useMutation } from '@tanstack/react-query';
import { feedbackApi, type FeedbackPayload } from '@/shared/api/feedback-api';

/**
 * Hook — send comment/feedback mutation.
 *
 * Usage:
 *   const { mutate, isPending, isSuccess, error } = useComment();
 *   mutate({ subject, message });
 */
export function useComment() {
  return useMutation({
    mutationFn: (payload: FeedbackPayload) =>
      feedbackApi.send(payload),
  });
}

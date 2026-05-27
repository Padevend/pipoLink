const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xkoyydpk';

export interface FeedbackPayload {
  subject: string;
  message: string;
}

export const feedbackApi = {
  /**
   * Send feedback via Formspree.
   * No auth required — external service.
   */
  send: async (payload: FeedbackPayload): Promise<void> => {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Échec de l\'envoi du commentaire.');
    }
  },
} as const;

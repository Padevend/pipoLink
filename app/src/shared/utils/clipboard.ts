import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

/**
 * Fonction générique pour copier le contenu d'une chaîne de caractères (mot ou long texte)
 * dans le presse-papier du système sur l'application mobile.
 *
 * @param text La chaîne de caractères à copier dans le presse-papier
 * @returns Promise<boolean> Indique si la copie a réussi avec succès
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text || typeof text !== 'string') return false;

  try {
    await Clipboard.setStringAsync(text);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback silencieux si les retour haptiques ne sont pas disponibles
    }
    return true;
  } catch (error) {
    console.error('[copyToClipboard] Error copying to clipboard:', error);
    return false;
  }
}

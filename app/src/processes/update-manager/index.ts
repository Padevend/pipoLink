import * as Updates from 'expo-updates';

export interface UpdateMeta {
  version: string;
  changelog: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Parse update metadata from the EAS Update manifest message.
 *
 * Convention: when publishing via `eas update`, pass a JSON string as `--message`:
 *   eas update --branch production --message '{"severity":"critical","version":"1.0.2","changelog":["Fix X"]}'
 *
 * The client reads it from `manifest.metadata.message`.
 */
function parseManifestMeta(manifest: Partial<Updates.Manifest> | undefined): UpdateMeta {
  const fallback: UpdateMeta = { version: '', changelog: [], severity: 'low' };
  try {
    const raw = (manifest as any)?.metadata?.message;
    if (raw && typeof raw === 'string') {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          version: parsed.version ?? fallback.version,
          changelog: Array.isArray(parsed.changelog) ? parsed.changelog : fallback.changelog,
          severity: ['low', 'medium', 'high', 'critical'].includes(parsed.severity)
            ? parsed.severity
            : fallback.severity,
        };
      }
    }
  } catch {
    // message was not JSON — treat as plain text, no structured meta
  }
  return fallback;
}

/**
 * Lightweight update manager backed by EAS Update (expo-updates).
 *
 * Replaces the old custom OTA transport layer while preserving the
 * business-level priority logic (severity → behaviour).
 */
export class UpdateManager {
  /**
   * Check for EAS updates and handle based on priority metadata.
   *
   * - `low` / `medium`  → silent background download, applied on next restart.
   * - `high` / `critical` → returns metadata so the caller can redirect to the
   *   blocking update screen.
   *
   * @returns UpdateMeta if a critical/high update needs user attention, null otherwise.
   */
  static async checkAndHandleUpdates(): Promise<UpdateMeta | null> {
    if (__DEV__) return null;

    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable || !result.manifest) return null;

      const meta = parseManifestMeta(result.manifest);
      const isCritical = meta.severity === 'critical' || meta.severity === 'high';

      if (isCritical) {
        // Critical: let the caller redirect to the blocking update screen.
        // The screen itself will handle fetch + reload.
        return meta;
      }

      // Low/Medium: silent background download. The update will be applied
      // automatically on the next cold start of the app.
      void Updates.fetchUpdateAsync().catch(console.error);
      return null;
    } catch (e) {
      console.error('[EAS Update] Check failed:', e);
      return null;
    }
  }

  /**
   * Manual check triggered by the user (e.g. Settings → Help → Check for updates).
   * Returns metadata for ANY available update regardless of severity.
   */
  static async manualCheck(): Promise<UpdateMeta | null> {
    if (__DEV__) return null;

    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable || !result.manifest) return null;
      return parseManifestMeta(result.manifest);
    } catch {
      return null;
    }
  }
}

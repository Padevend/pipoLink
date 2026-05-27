import { updatesApi, UpdateMetadata } from '@/shared/api/updates';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export class UpdateManager {
  static async checkAndHandleUpdates(): Promise<UpdateMetadata | null> {
    try {
      const updateData = await updatesApi.checkUpdate();
      if (!updateData) return null;

      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      if (updateData.version === currentVersion) return null;

      if (updateData.type === 'auto') {
        this.handleSilentOTA(updateData).catch(console.error);
      }

      return updateData;
    } catch (e) {
      console.error('Update check failed', e);
      return null;
    }
  }

  static async handleSilentOTA(updateData: UpdateMetadata) {
    if (__DEV__) return;
    try {
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        await Updates.fetchUpdateAsync();
        if (updateData.severity === 'low') {
          // Will be applied on next restart
        } else {
          // Medium or critical severity: force reload immediately or prompt
          await Updates.reloadAsync();
        }
      }
    } catch (e) {
      console.error('OTA update error', e);
    }
  }

  static getStoreLink(updateData: UpdateMetadata): string | undefined {
    return updateData.links?.find((l) => l.platform === Platform.OS)?.link;
  }
}

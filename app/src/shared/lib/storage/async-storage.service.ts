import AsyncStorage from '@react-native-async-storage/async-storage';

export const AsyncStorageService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as unknown as T;
        }
      }
      return null;
    } catch (error) {
      console.warn(`[AsyncStorage] Failed to get item ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.warn(`[AsyncStorage] Failed to set item ${key}:`, error);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`[AsyncStorage] Failed to remove item ${key}:`, error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.warn('[AsyncStorage] Failed to clear storage:', error);
    }
  },
};

import React, { useState } from 'react';
import { View, Text, SafeAreaView, Pressable } from 'react-native';
import * as Updates from 'expo-updates';
import { useRouter } from 'expo-router';
import { useOtaUpdate } from '@/features/updates/hooks/use-ota-update';
import { Button } from '@/shared/ui/button';
import { Download, Rocket, X } from 'lucide-react-native';

export default function UpdateAvailableModal() {
  const router = useRouter();
  const { data } = useOtaUpdate();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (e) {
      console.error('Update failed:', e);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 px-6 items-center justify-center gap-10">
        <View className="w-24 h-24 bg-success/10 rounded-[32px] items-center justify-center">
          <Rocket size={48} color="#22C55E" />
        </View>

        <View className="items-center gap-2">
          <Text className="text-2xl font-black text-text-primary-light dark:text-text-primary-dark text-center">
            New Version Ready!
          </Text>
          <Text className="text-text-secondary-light dark:text-text-secondary-dark text-center px-8 leading-6">
            Version {data?.version || '1.1.0'} is available with new features and stability improvements.
          </Text>
          {data?.notes && (
            <View className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-border-light dark:border-border-dark w-full">
              <Text className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest mb-1">
                What's New:
              </Text>
              <Text className="text-sm text-text-primary-light dark:text-text-primary-dark">
                {data.notes}
              </Text>
            </View>
          )}
        </View>

        <View className="w-full gap-4">
          <Button 
            label="Install & Relaunch"
            onPress={handleInstall}
            loading={isInstalling}
            size="xl"
            leftIcon={<Download size={20} color="#FFFFFF" />}
          />
          <Button 
            label="Maybe Later"
            variant="ghost"
            onPress={() => router.back()}
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
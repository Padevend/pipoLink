import React, { useState } from 'react';
import { View, Text } from 'react-native';
import * as Updates from 'expo-updates';
import { router } from 'expo-router';
import { useOtaUpdate } from '@/features/updates/hooks/use-ota-update';
import { Button } from '@/shared/ui/button';
import { Download, Rocket } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UpdateAvailableModal() {
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
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'bottom', 'left', 'right']}>
      <View className="flex-1 px-6 items-center justify-center gap-y-6">
        
        {/* Badge d'icône Fusée - Mat & Marque */}
        <View className="w-16 h-16 rounded-2xl items-center justify-center bg-orange-50 dark:bg-orange-950/20 border border-orange-100/60 dark:border-orange-900/30">
          <Rocket size={26} color="#F97316" />
        </View>

        {/* Section Textuelle & Présentation de la Version */}
        <View className="items-center w-full">
          <Text className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 text-center">
            Mise à jour disponible !
          </Text>
          
          <Text className="text-zinc-500 dark:text-zinc-400 text-center text-xs leading-5 mt-2 px-4">
            La version <Text className="font-bold text-zinc-900 dark:text-zinc-50">{data?.version || '1.1.0'}</Text> est prête à être installée pour optimiser la sécurité et la stabilité de vos services.
          </Text>

          {/* Notes de mise à jour (Îlot Mat Opaque) */}
          {data?.changelog && data.changelog.length > 0 && (
            <View className="mt-5 w-full rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-900 dark:bg-zinc-900/50">
              <Text className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Au programme :
              </Text>
              <Text className="text-xs leading-5 font-medium text-zinc-700 dark:text-zinc-300">
                {data.changelog.join('\n')}
              </Text>
            </View>
          )}
        </View>

        {/* Bloc d'Actions Épuré */}
        <View className="w-full gap-y-2 mt-4">
          <Button 
            label="Installer et redémarrer"
            onPress={() => void handleInstall()}
            loading={isInstalling}
            size="xl"
            className="rounded-xl h-12 bg-orange-500 active:bg-orange-600"
            rightIcon={!isInstalling ? <Download size={15} color="#FFFFFF" /> : undefined}
          />
          
          <Button 
            label="Plus tard"
            variant="ghost"
            onPress={() => router.back()}
            disabled={isInstalling}
            className="h-11 rounded-xl text-zinc-500 dark:text-zinc-400 active:bg-zinc-50 dark:active:bg-zinc-900"
          />
        </View>

      </View>
    </SafeAreaView>
  );
}
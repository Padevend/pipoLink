import React, { useState } from 'react';
import { View, Text} from 'react-native';
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
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 px-6 items-center justify-center gap-y-8">
        
        {/* Badge d'icône Fusée Stylisé (Zéro Ombre) */}
        <View 
          className="w-18 h-18 rounded-[22px] items-center justify-center border border-emerald-500/10"
          style={{ backgroundColor: '#10B98115' }}
        >
          <Rocket size={32} color="#10B981" />
        </View>

        {/* Section Textuelle & Présentation de la Version */}
        <View className="items-center w-full">
          <Text className="text-[24px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark text-center">
            Mise à jour disponible !
          </Text>
          
          <Text className="text-text-secondary-light/70 dark:text-text-secondary-dark/60 text-center text-[13px] leading-[20px] font-medium mt-2 px-4">
            La version <Text className="font-bold text-text-primary-light dark:text-text-primary-dark">{data?.version || '1.1.0'}</Text> est prête à être installée pour optimiser la sécurité et la stabilité de vos services.
          </Text>

          {/* Notes de mise à jour (Style Satiné / Glassmorphic) */}
          {data?.changelog && data.changelog.length > 0 && (
            <View className="mt-6 w-full rounded-2xl border border-border-light/40 bg-surface-light/50 p-4 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
              <Text className="text-[10px] font-bold text-text-secondary-light/50 dark:text-text-secondary-dark/50 uppercase tracking-wider mb-2">
                Au programme :
              </Text>
              <Text className="text-[13px] leading-[20px] font-medium text-text-primary-light dark:text-text-primary-dark">
                {data.changelog.join('\n')}
              </Text>
            </View>
          )}
        </View>

        {/* Bloc d'Actions Épuré */}
        <View className="w-full gap-y-2.5 mt-4">
          <Button 
            label="Installer et redémarrer"
            onPress={() => void handleInstall()}
            loading={isInstalling}
            size="xl"
            className="rounded-xl h-12"
            rightIcon={!isInstalling ? <Download size={16} color="#FFFFFF" /> : undefined}
          />
          
          <Button 
            label="Plus tard"
            variant="ghost"
            onPress={() => router.back()}
            disabled={isInstalling}
            className="h-10 text-text-secondary-light dark:text-text-secondary-dark"
          />
        </View>

      </View>
    </SafeAreaView>
  );
}
import { useOtaUpdate } from '@/features/updates/hooks/use-ota-update';
import { Button } from '@/shared/ui/button';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';
import { Download, Rocket } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UpdateAvailableModal() {
  const { data } = useOtaUpdate();
  const [isInstalling, setIsInstalling] = useState(false);
  const insets = useSafeAreaInsets();

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
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'bottom', 'left', 'right']}>
      <View className="flex-1 px-6 items-center justify-center gap-y-6" style={{ paddingBottom: insets.bottom + 24 }}>
        
        {/* Badge d'icône Fusée (rounded-full) */}
        <View className="w-20 h-20 rounded-full items-center justify-center bg-orange-500/10 border-2 border-orange-500/30">
          <Rocket size={32} color="#F97316" strokeWidth={2.5} />
        </View>

        {/* Section Textuelle & Présentation de la Version */}
        <View className="items-center w-full">
          <Text className="text-xl font-black tracking-tight text-zinc-950 dark:text-white text-center">
            Mise à jour disponible !
          </Text>
          
          <Text className="text-zinc-500 dark:text-zinc-400 text-center text-xs font-bold leading-relaxed mt-2 px-4">
            La version <Text className="font-black text-zinc-950 dark:text-white">{data?.version || '1.1.0'}</Text> est prête à être installée pour optimiser la sécurité et la stabilité de vos services.
          </Text>

          {/* Notes de mise à jour (Arrondis 2xl, fond plein) */}
          {data?.changelog && data.changelog.length > 0 && (
            <View className="mt-6 w-full rounded-2xl bg-zinc-100 p-6 dark:bg-[#1A1A1A]">
              <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3">
                Au programme :
              </Text>
              <View className="gap-y-3">
                {data.changelog.map((item, index) => (
                  <View key={index} className="flex-row items-start gap-x-3">
                    <View className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
                    <Text className="flex-1 text-xs font-bold leading-relaxed text-zinc-950 dark:text-white">
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Bloc d'Actions (rounded-full) */}
        <View className="w-full gap-y-3 mt-4">
          <Button 
            label="Installer et redémarrer"
            onPress={() => void handleInstall()}
            loading={isInstalling}
            size="lg"
            className="rounded-full h-14 bg-orange-500 active:bg-orange-600"
            rightIcon={!isInstalling ? <Download size={18} color="#FFFFFF" strokeWidth={2.5} /> : undefined}
          />
          
          <Pressable 
            onPress={() => router.back()}
            disabled={isInstalling}
            className="w-full h-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 disabled:opacity-50"
          >
            <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white">
              Plus tard
            </Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}
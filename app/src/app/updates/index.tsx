import { useOtaUpdate } from '@/features/updates/hooks/use-ota-update';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import * as Updates from 'expo-updates';
import { AlertTriangle, ArrowLeft, Clock, Download, Sparkles } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UpdateScreen(): JSX.Element {
  const { redirect } = useLocalSearchParams();
  const { data, isLoading } = useOtaUpdate();
  const currentVersion = Constants.expoConfig?.version || '1.0.0';
  const insets = useSafeAreaInsets();

  const isCritical = data?.severity === 'critical' || data?.severity === 'high';

  const handleDownload = async () => {
    if (!__DEV__) {
      await Updates.fetchUpdateAsync().catch(() => {});
      await Updates.reloadAsync();
    }
  };

  const handleLater = () => {
    if (isCritical) return;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace((redirect as string) as any || '/(tabs)');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A] justify-center items-center">
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    );
  }

  if (!data) return <View />;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        {!isCritical ? (
          <Pressable 
            onPress={handleLater} 
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Centre de mise à jour
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            OTA System
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* EN-TÊTE GÉOMÉTRIQUE (Arrondis 2xl, fond plein) */}
        <Animated.View entering={FadeInDown.springify()} className="items-center mb-8">
          {isCritical ? (
            <View className="h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border-2 border-red-500/30 mb-5">
              <AlertTriangle size={28} color="#EF4444" strokeWidth={2.5} />
            </View>
          ) : (
            <View className="h-20 w-20 items-center justify-center rounded-full bg-orange-500/10 border-2 border-orange-500/30 mb-5">
              <Sparkles size={28} color="#F97316" strokeWidth={2.5} />
            </View>
          )}

          <Text className="text-xl font-black tracking-tight text-zinc-950 dark:text-white text-center mb-2">
            {isCritical ? "Mise à jour obligatoire" : "Nouvelle version disponible"}
          </Text>
          <Text className="text-xs font-bold leading-relaxed text-center text-zinc-500 dark:text-zinc-400 px-4">
            {isCritical 
              ? "Cette révision majeure apporte des correctifs de sécurité critiques. L'application doit être mise à jour pour continuer son exécution."
              : "Une nouvelle version de PipoLink est arrivée. Installez-la pour profiter des dernières optimisations de l'application."
            }
          </Text>
        </Animated.View>

        {/* CONTENEUR DE SPÉCIFICATIONS (Arrondis 2xl, fond plein) */}
        <Animated.View 
          entering={FadeInDown.delay(100).springify()} 
          className="w-full rounded-2xl bg-zinc-100 p-6 dark:bg-[#1A1A1A] mb-8"
        >
          <View className="flex-row items-center justify-between border-b-2 border-zinc-200 dark:border-[#222222] pb-4 mb-5">
            <View className="gap-y-1">
              <Text className="text-sm font-black tracking-tight text-zinc-950 dark:text-white">
                Version {data.version}
              </Text>
              <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Build actuel : {currentVersion}
              </Text>
            </View>

            {/* Badges de criticité (rounded-full) */}
            {isCritical ? (
              <View className="bg-red-500/10 border border-red-500/20 px-3.5 py-1.5 rounded-full">
                <Text className="text-[10px] font-black text-red-500 uppercase tracking-widest">Critique</Text>
              </View>
            ) : data.severity === 'medium' ? (
              <View className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full">
                <Text className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Recommandée</Text>
              </View>
            ) : (
              <View className="bg-white dark:bg-[#222222] px-3.5 py-1.5 rounded-full">
                <Text className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Stable</Text>
              </View>
            )}
          </View>

          {/* Liste des changements (Changelog) */}
          <Text className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3">
            Nouveautés de cette version
          </Text>
          <View className="gap-y-4">
            {data.changelog?.map((item, index) => (
              <View key={index} className="flex-row items-start gap-x-3">
                <View className={`h-2 w-2 rounded-full mt-2 ${isCritical ? 'bg-red-500' : 'bg-orange-500'}`} />
                <Text className="flex-1 text-xs font-bold leading-relaxed text-zinc-950 dark:text-white">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* BOUTONS D'ACTION (rounded-full) */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="gap-y-3 w-full">
          <Pressable
            onPress={handleDownload}
            className={`w-full h-14 rounded-full items-center justify-center flex-row gap-x-2.5 active:opacity-80 transition-opacity ${
              isCritical 
                ? 'bg-red-500' 
                : 'bg-orange-500'
            }`}
          >
            <Download size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white font-black text-xs uppercase tracking-widest">
              {isCritical ? 'Mettre à jour maintenant' : 'Appliquer la mise à jour'}
            </Text>
          </Pressable>

          {!isCritical && (
            <Pressable
              onPress={handleLater}
              className="w-full h-14 rounded-full items-center justify-center flex-row gap-x-2.5 bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
            >
              <Clock size={18} color="#A1A1AA" strokeWidth={2.5} />
              <Text className="text-zinc-950 dark:text-white font-black text-xs uppercase tracking-widest">
                Ignorer pour l'instant
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
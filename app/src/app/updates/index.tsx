import { useOtaUpdate } from '@/features/updates/hooks/use-ota-update';
import { UpdateManager } from '@/processes/update-manager';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import * as Updates from 'expo-updates';
import { AlertTriangle, ArrowLeft, Clock, Download, Sparkles } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UpdateScreen(): JSX.Element {
  const { redirect } = useLocalSearchParams();
  const { data, isLoading } = useOtaUpdate();
  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  const isCritical = data?.severity === 'critical' || data?.isRequired;

  const handleDownload = async () => {
    if (data?.type === 'manual') {
      const link = UpdateManager.getStoreLink(data);
      if (link) Linking.openURL(link);
    } else {
      if (!__DEV__) {
         await Updates.fetchUpdateAsync().catch(() => {});
         await Updates.reloadAsync();
      }
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
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 justify-center items-center">
        <ActivityIndicator size="small" color="#F97316" />
      </SafeAreaView>
    );
  }

  if (!data) return <View />;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>
      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        {!isCritical ? (
          <Pressable 
            onPress={handleLater} 
            className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <ArrowLeft size={14} color="#71717A" />
          </Pressable>
        ) : (
          <View className="w-8" />
        )}
        <Text className="flex-1 ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Centre de mise à jour
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* EN-TÊTE GÉOMÉTRIQUE MAT */}
        <Animated.View entering={FadeInDown.springify()} className="items-center mb-6">
          {isCritical ? (
            <View className="h-14 w-14 items-center justify-center rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50 mb-4">
              <AlertTriangle size={20} color="#EF4444" strokeWidth={2} />
            </View>
          ) : (
            <View className="h-14 w-14 items-center justify-center rounded-xl bg-orange-50 border border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50 mb-4">
              <Sparkles size={20} color="#F97316" strokeWidth={2} />
            </View>
          )}

          <Text className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 text-center mb-2">
            {isCritical ? "Mise à jour obligatoire" : "Nouvelle version disponible"}
          </Text>
          <Text className="text-xs font-semibold leading-5 text-center text-zinc-400 dark:text-zinc-500 px-4">
            {isCritical 
              ? "Cette révision majeure apporte des correctifs de sécurité critiques. L'application doit être mise à jour pour continuer son exécution."
              : "Une nouvelle version de PipoLink est arrivée. Installez-la pour profiter des dernières optimisations de l'application."
            }
          </Text>
        </Animated.View>

        {/* CONTENEUR DE SPÉCIFICATIONS MATE */}
        <Animated.View 
          entering={FadeInDown.delay(100).springify()} 
          className="w-full rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950 mb-6"
        >
          <View className="flex-row items-center justify-between border-b border-zinc-100 pb-3 mb-3 dark:border-zinc-900">
            <View className="gap-y-0.5">
              <Text className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Version {data.version}
              </Text>
              <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Build actuel : {currentVersion}
              </Text>
            </View>

            {/* Badges de criticité plats */}
            {isCritical ? (
              <View className="bg-red-50 border border-red-200 px-2 py-0.5 rounded-md dark:bg-red-950/30 dark:border-red-900/50">
                <Text className="text-[9px] font-bold text-red-500 uppercase tracking-wide">Critique</Text>
              </View>
            ) : data.severity === 'medium' ? (
              <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md dark:bg-amber-950/30 dark:border-amber-900/50">
                <Text className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Recommandée</Text>
              </View>
            ) : (
              <View className="bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-md dark:bg-zinc-900 dark:border-zinc-800">
                <Text className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Stable</Text>
              </View>
            )}
          </View>

          {/* Liste des changements (Changelog) */}
          <Text className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">
            Nouveautés de cette version
          </Text>
          <View className="gap-y-3">
            {data.changelog?.map((item, index) => (
              <View key={index} className="flex-row items-start gap-x-2.5">
                <View className={`h-1.5 w-1.5 rounded-full mt-1.5 ${isCritical ? 'bg-red-500' : 'bg-orange-500'}`} />
                <Text className="flex-1 text-xs leading-5 font-semibold text-zinc-400 dark:text-zinc-500">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* BOUTONS D'ACTION MATS */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="gap-y-2.5 w-full">
          <Pressable
            onPress={handleDownload}
            className={`w-full h-12 rounded-xl items-center justify-center flex-row gap-x-2 ${
              isCritical 
                ? 'bg-red-500 active:bg-red-600' 
                : 'bg-orange-500 active:bg-orange-600'
            }`}
          >
            <Download size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white font-bold text-xs uppercase tracking-wider">
              {data.type === 'auto' ? 'Appliquer la mise à jour' : 'Mettre à jour maintenant'}
            </Text>
          </Pressable>

          {!isCritical && (
            <Pressable
              onPress={handleLater}
              className="w-full h-12 rounded-xl items-center justify-center flex-row gap-x-2 border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950 active:bg-zinc-50 dark:active:bg-zinc-900/50"
            >
              <Clock size={14} color="#71717A" strokeWidth={2} />
              <Text className="text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider">
                Ignorer pour l'instant
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
import { useOtaUpdate } from '@/features/updates/hooks/use-ota-update';
import { UpdateManager } from '@/processes/update-manager';
import { BRAND } from '@/shared/config/brand';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import * as Updates from 'expo-updates';
import { AlertTriangle, ArrowLeft, Clock, Download, Sparkles } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── COMPOSANT BOUTON PREMIUM AVEC MICRO-REBOND ─────────────────────────────
function AnimatedButton({ 
  onPress, 
  children, 
  className, 
  style 
}: { 
  onPress: () => void; 
  children: React.ReactNode; 
  className?: string; 
  style?: any;
}) {
  return (
    <Animated.View>
      <Pressable
        onPress={onPress}
        className={className}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ─── ÉCRAN PRINCIPAL ─────────────────────────────────────────────────────────
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
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark justify-center items-center">
        <ActivityIndicator size="small" color={BRAND.primary} />
      </SafeAreaView>
    );
  }

  if (!data) return <View />;

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      {/* BARRE SUPÉRIEURE ÉPURÉE */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-border-light/20 dark:border-border-dark/10 bg-surface-light/40 dark:bg-surface-dark/40 backdrop-blur-md">
        {!isCritical ? (
          <Pressable onPress={handleLater} className="h-8 w-8 items-center justify-center rounded-full active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors">
            <ArrowLeft size={18} className="text-text-secondary-light/60 dark:text-text-secondary-dark/60" />
          </Pressable>
        ) : (
          <View className="w-8" />
        )}
        <Text className="text-[15px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Centre de mise à jour
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* EN-TÊTE DYNAMIQUE SANS ROUGE ENVAHISSANT */}
        <Animated.View entering={FadeInDown.springify()} className="items-center mb-8">
          {isCritical ? (
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 mb-5">
              <AlertTriangle size={24} color="red" strokeWidth={2} />
            </View>
          ) : (
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-5">
              <Sparkles size={24} color="indigo" strokeWidth={2} />
            </View>
          )}

          <Text className="text-[22px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark text-center mb-2.5">
            {isCritical ? "Mise à jour obligatoire" : "Nouvelle version disponible"}
          </Text>
          <Text className="text-[13px] font-medium leading-5 text-center text-text-secondary-light/50 dark:text-text-secondary-dark/50 px-4">
            {isCritical 
              ? "Cette révision majeure apporte des correctifs de sécurité critiques. L'application doit être mise à jour pour continuer son exécution."
              : "Une nouvelle version de PipoLink est arrivée. Installez-la pour profiter des dernières optimisations de l'application."
            }
          </Text>
        </Animated.View>

        {/* CONTENEUR DE CARTE SPECIFICATIONS */}
        <Animated.View 
          entering={FadeInDown.delay(100).springify()} 
          className="w-full rounded-2xl border border-border-light/30 bg-surface-light/40 p-5 dark:border-border-dark/10 dark:bg-surface-dark/40 backdrop-blur-md mb-8"
        >
          <View className="flex-row items-center justify-between border-b border-border-light/30 pb-4 mb-4 dark:border-border-dark/10">
            <View className="gap-y-0.5">
              <Text className="text-[16px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                Version {data.version}
              </Text>
              <Text className="text-[11px] font-bold uppercase tracking-wider text-text-secondary-light/30 dark:text-text-secondary-dark/30">
                Votre build actuel : {currentVersion}
              </Text>
            </View>

            {/* Badges de criticité sophistiqués */}
            {isCritical ? (
              <View className="bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">
                <Text className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Critique</Text>
              </View>
            ) : data.severity === 'medium' ? (
              <View className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Recommandée</Text>
              </View>
            ) : (
              <View className="bg-text-secondary-light/5 border border-border-light/20 px-2.5 py-1 rounded-md">
                <Text className="text-[10px] font-bold text-text-secondary-light/50 dark:text-text-secondary-dark/50 uppercase tracking-wide">Stable</Text>
              </View>
            )}
          </View>

          {/* Liste des changements (Changelog) */}
          <Text className="text-[11px] font-bold text-text-secondary-light/40 dark:text-text-secondary-dark/40 uppercase tracking-widest mb-3">
            Nouveautés de cette version
          </Text>
          <View className="gap-y-3.5">
            {data.changelog?.map((item, index) => (
              <View key={index} className="flex-row items-start gap-x-3">
                <View className="h-1.5 w-1.5 rounded-full mt-2" style={{ backgroundColor: isCritical ? '#ef4444' : BRAND.primary }} />
                <Text className="flex-1 text-[13px] leading-[20px] font-medium text-text-secondary-light/80 dark:text-text-secondary-dark/70">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* SECTION ACTIONS FINALES EN BAS */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="gap-y-2.5 w-full">
          <AnimatedButton
            onPress={handleDownload}
            className="w-full h-12 rounded-xl items-center justify-center flex-row gap-x-2 shadow-sm"
            style={{ backgroundColor: isCritical ? '#ef4444' : BRAND.primary }}
          >
            <Download size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white font-bold text-[13px] uppercase tracking-wider">
              {data.type === 'auto' ? 'Appliquer la mise à jour' : 'Mettre à jour maintenant'}
            </Text>
          </AnimatedButton>

          {!isCritical && (
            <AnimatedButton
              onPress={handleLater}
              className="w-full h-12 rounded-xl items-center justify-center flex-row gap-x-2 border border-border-light/40 dark:border-border-dark/20 bg-surface-light dark:bg-surface-dark"
            >
              <Clock size={16} className="text-text-secondary-light/50 dark:text-text-secondary-dark/50" strokeWidth={2} />
              <Text className="text-text-secondary-light/70 dark:text-text-secondary-dark/70 font-bold text-[12px] uppercase tracking-wide">
                Ignorer pour l'instant
              </Text>
            </AnimatedButton>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
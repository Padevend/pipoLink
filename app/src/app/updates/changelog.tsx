import { ArrowLeft, GitCommit, Sparkles } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { useOtaUpdate } from '@/features/updates/hooks/use-ota-update';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChangelogScreen(): JSX.Element {
  const { data, isLoading } = useOtaUpdate();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center bg-white px-6 py-4 dark:bg-[#0A0A0A]">
        <Pressable 
          onPress={() => router.back()} 
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>
        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Notes de version
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Mises à jour OTA
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* EN-TÊTE DESCRIPTIF STATIQUE */}
        <View className="mb-8">
            <View className="flex-row items-center gap-4 mb-4">
              <View className="flex-1 justify-center">
                <Text className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
                  Ce que nous avons amélioré
                </Text>
              </View>
            </View>
            <Text className="text-xs font-bold leading-relaxed text-zinc-400">
              Suivez en temps réel les nouveautés, correctifs et optimisations déployés sur PipoLink pour vous garantir une expérience académique toujours plus fluide, rapide et sécurisée.
            </Text>
        </View>

        {isLoading ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        ) : null}

        {/* CONTENEUR DES NOTES DE VERSION (Arrondis 2xl, fond plein) */}
        {!isLoading && data ? (
          <View className="w-full">
            <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3">
              Version déployée
            </Text>
            <View className="w-full rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] p-6">

              {/* EN-TÊTE DU BLOC */}
              <View className="flex-row items-center justify-between border-b-2 border-zinc-200 dark:border-[#222222] pb-4 mb-5">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
                    <GitCommit size={18} color="#F97316" strokeWidth={2.5} />
                  </View>
                  <Text className="text-sm font-black tracking-tight text-zinc-950 dark:text-white">
                    Version {data.version}
                  </Text>
                </View>

                {/* Indicateur version actuelle (rounded-full) */}
                <View className="flex-row items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
                  <Sparkles size={12} color="#10B981" strokeWidth={2.5} />
                  <Text className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Actuelle
                  </Text>
                </View>
              </View>

              {/* LISTE DES CHANGEMENTS */}
              <View className="gap-y-4">
                {data.changelog?.map((item) => (
                  <View key={item} className="flex-row items-start gap-x-3">
                    <View className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
                    <Text className="flex-1 text-xs font-bold leading-relaxed text-zinc-950 dark:text-white">
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
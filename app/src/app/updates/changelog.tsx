import { ArrowLeft, GitCommit, Sparkles } from 'lucide-react-native';
import { ScrollView, Text, View, Pressable } from 'react-native';

import { useOtaUpdate } from '@/features/updates/hooks/use-ota-update';
import { Loader } from '@/shared/ui/loader';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChangelogScreen(): JSX.Element {
  const { data, isLoading } = useOtaUpdate();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable 
          onPress={() => router.back()} 
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>
        <Text className="flex-1 ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Notes de version
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="py-12 items-center justify-center">
            <Loader />
          </View>
        ) : null}

        {/* CONTENEUR DES NOTES DE VERSION MAT */}
        {!isLoading && data ? (
          <View className="w-full rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950">

            {/* EN-TÊTE DU BLOC */}
            <View className="flex-row items-center justify-between border-b border-zinc-100 pb-3 mb-3 dark:border-zinc-900">
              <View className="flex-row items-center gap-2">
                <View className="h-7 w-7 items-center justify-center rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50">
                  <GitCommit size={14} color="#F97316" />
                </View>
                <Text className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Version {data.version}
                </Text>
              </View>

              {/* Indicateur version actuelle plat */}
              <View className="flex-row items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md dark:bg-emerald-950/30 dark:border-emerald-900/50">
                <Sparkles size={10} color="#10B981" />
                <Text className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Actuelle
                </Text>
              </View>
            </View>

            {/* LISTE DES CHANGEMENTS */}
            <View className="gap-y-3">
              {data.changelog?.map((item) => (
                <View key={item} className="flex-row items-start gap-x-2.5">
                  <View className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-1.5" />
                  <Text className="flex-1 text-xs leading-5 font-semibold text-zinc-400 dark:text-zinc-500">
                    {item}
                  </Text>
                </View>
              ))}
            </View>

          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
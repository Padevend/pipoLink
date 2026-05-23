import { ScrollView, Text, View } from 'react-native';
import { GitCommit, Sparkles } from 'lucide-react-native';

import { useOtaUpdate } from '@/features/updates/hooks/use-ota-update';
import { Header } from '@/shared/ui/header';
import { Loader } from '@/shared/ui/loader';
import { BRAND } from '@/shared/config/brand';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChangelogScreen(): JSX.Element {
  const { data, isLoading } = useOtaUpdate();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 bg-background-light dark:bg-background-dark"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête Global de l'Écran */}
        <Header title="Changelog" subtitle="Historique des versions" />

        <View className="px-5 py-4">
          {isLoading ? (
            <View className="py-12 items-center justify-center">
              <Loader />
            </View>
          ) : null}

          {/* Affichage des Notes de Version */}
          {!isLoading && data ? (
            <View className="w-full rounded-2xl border border-border-light/40 bg-surface-light/50 p-5 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">

              {/* Badge de Version Stylisé */}
              <View className="flex-row items-center justify-between border-b border-border-light/40 pb-4 mb-4 dark:border-border-dark/20">
                <View className="flex-row items-center gap-2.5">
                  <View
                    className="h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${BRAND.primary}15` }}
                  >
                    <GitCommit size={15} color={BRAND.primary} />
                  </View>
                  <Text className="text-[16px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                    Version {data.version}
                  </Text>
                </View>

                {/* Indicateur de version actuelle */}
                <View className="flex-row items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <Sparkles size={10} className="text-emerald-500" />
                  <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Actuelle
                  </Text>
                </View>
              </View>

              {/* Liste des Changements sous forme de lignes fluides */}
              <View className="gap-y-3.5">
                {data.changelog?.map((item) => (
                  <View key={item} className="flex-row items-start gap-3">
                    {/* Puce customisée style ligne temporelle mini */}
                    <View className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" style={{ backgroundColor: BRAND.primary }} />

                    <Text className="flex-1 text-[13px] leading-[20px] font-medium text-text-secondary-light/80 dark:text-text-secondary-dark/70">
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
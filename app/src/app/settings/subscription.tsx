import { ArrowLeft, Check, Info, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/providers';
import { Button } from '@/shared/ui/button';
import { router } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';

export default function SubscriptionScreen(): JSX.Element {
  const { t } = useTranslation('settings');
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const isPremium = user?.subscription?.plan === 'PREMIUM' && user?.subscription?.status === 'ACTIVE';

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
          Abonnement
        </Text>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: insets.bottom + 24 }} 
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-y-4">

          {/* CARTE : PLAN GRATUIT (Mat Sobre) */}
          <View className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Plan Gratuit
              </Text>
              {!isPremium && (
                <View className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 border border-zinc-200 dark:border-zinc-700">
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Actuel
                  </Text>
                </View>
              )}
            </View>

            {/* Avantages Free énumérés */}
            <View className="gap-y-2.5">
              <View className="flex-row items-center gap-x-2.5">
                <Check size={13} color="#71717A" />
                <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  2 500 jetons IA disponibles à l'inscription
                </Text>
              </View>
              <View className="flex-row items-center gap-x-2.5">
                <Check size={13} color="#71717A" />
                <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Renouvellement des jetons toutes les 6 heures
                </Text>
              </View>
              <View className="flex-row items-center gap-x-2.5">
                <Check size={13} color="#71717A" />
                <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Accès standard à la bibliothèque (5 documents, max 5 Mo)
                </Text>
              </View>
            </View>
          </View>

          {/* CARTE : PLAN PREMIUM (Mat Contrasté Orange) */}
          <View className="rounded-xl border border-orange-200 bg-orange-50/20 p-4 dark:border-orange-950/30 dark:bg-orange-950/10">

            {/* En-tête de l'offre */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-x-1.5">
                <Sparkles size={14} color="#F97316" />
                <Text className="text-sm font-bold tracking-tight text-orange-500 dark:text-orange-400">
                  Plan Premium
                </Text>
              </View>
              {isPremium ? (
                <View className="rounded-md bg-orange-500 px-2 py-0.5 border border-orange-600">
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-white">
                    Actuel
                  </Text>
                </View>
              ) : (
                <View className="rounded-md bg-orange-100 dark:bg-orange-950/50 px-2 py-0.5 border border-orange-200 dark:border-orange-900/30">
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    Recommandé
                  </Text>
                </View>
              )}
            </View>

            {/* Avantages Premium énumérés */}
            <View className="gap-y-2.5 mb-5">
              <View className="flex-row items-center gap-x-2.5">
                <View className="h-4 w-4 rounded-md bg-orange-100 dark:bg-orange-950/40 items-center justify-center border border-orange-200/30">
                  <Check size={11} color="#F97316" />
                </View>
                <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  8 000 jetons IA par fenêtre de restauration
                </Text>
              </View>

              <View className="flex-row items-center gap-x-2.5">
                <View className="h-4 w-4 rounded-md bg-orange-100 dark:bg-orange-950/40 items-center justify-center border border-orange-200/30">
                  <Check size={11} color="#F97316" />
                </View>
                <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Renouvellement accéléré toutes les 3h 30min
                </Text>
              </View>

              <View className="flex-row items-center gap-x-2.5">
                <View className="h-4 w-4 rounded-md bg-orange-100 dark:bg-orange-950/40 items-center justify-center border border-orange-200/30">
                  <Check size={11} color="#F97316" />
                </View>
                <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Génération d'Outils d'Étude (Résumés, Quiz, FAQ, Chronologies...)
                </Text>
              </View>

              <View className="flex-row items-center gap-x-2.5">
                <View className="h-4 w-4 rounded-md bg-orange-100 dark:bg-orange-950/40 items-center justify-center border border-orange-200/30">
                  <Check size={11} color="#F97316" />
                </View>
                <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Bibliothèque illimitée (fichiers jusqu'à 50 Mo)
                </Text>
              </View>

              <View className="flex-row items-center gap-x-2.5">
                <View className="h-4 w-4 rounded-md bg-orange-100 dark:bg-orange-950/40 items-center justify-center border border-orange-200/30">
                  <Check size={11} color="#F97316" />
                </View>
                <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Recherche sémantique dans la bibliothèque
                </Text>
              </View>
            </View>

            {/* Bouton d'action */}
            {isPremium ? (
              <Button
                label="Abonné Premium Actif"
                onPress={() => undefined}
                disabled
                className="rounded-xl h-11 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400"
              />
            ) : (
              <Button
                label="S'abonner (2 500 XAF/mois)"
                onPress={() => router.push('/settings/payment')}
                className="rounded-xl h-11 bg-orange-500 active:bg-orange-600"
              />
            )}
          </View>

          {/* Note d'information contextuelle */}
          <View className="flex-row items-start gap-x-2 px-1 mt-1">
            <Info size={13} color="#A1A1AA" className="mt-0.5 shrink-0" />
            <Text className="flex-1 text-xs font-medium text-zinc-400 dark:text-zinc-500 leading-4">
              L'abonnement Premium soutient le développement de PipoLink et libère la puissance totale de l'IA Hiro pour booster votre réussite universitaire.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
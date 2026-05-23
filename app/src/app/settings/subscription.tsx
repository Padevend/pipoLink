import { Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Sparkles, Check, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/shared/ui/button';
import { BRAND } from '@/shared/config/brand';
import { ScrollView } from 'react-native-gesture-handler';

export default function SubscriptionScreen(): JSX.Element {
  const { t } = useTranslation('settings');
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      {/* Header Translucide Style Glassmorphism */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable 
          onPress={() => router.back()} 
          className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 border border-border-light/20 dark:bg-background-dark/30 active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} color="#64748B" />
        </Pressable>
        
        <Text className="flex-1 ml-3 text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          {t('subscription')}
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="gap-5">
          
          {/* CARTE : PLAN GRATUIT (Satiné Sobre) */}
          <View className="rounded-2xl border border-border-light/40 bg-surface-light/50 p-5 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-[16px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                {t('planFree')}
              </Text>
              <View className="rounded-full bg-text-secondary-light/10 dark:bg-text-secondary-dark/10 px-2.5 py-0.5 border border-border-light/10">
                <Text className="text-[10px] font-bold text-text-secondary-light dark:text-text-secondary-dark">
                  Actuel
                </Text>
              </View>
            </View>

            {/* Avantages Free énumérés */}
            <View className="gap-2.5">
              <View className="flex-row items-center gap-2">
                <Check size={14} color="#64748B" />
                <Text className="text-[12px] font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  20 messages IA / jour
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Check size={14} color="#64748B" />
                <Text className="text-[12px] font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Accès standard à la bibliothèque
                </Text>
              </View>
            </View>
          </View>

          {/* CARTE : PLAN PREMIUM (Premium Glassmorphism avec couleur de marque) */}
          <View className="rounded-2xl border border-primary/20 bg-surface-light/80 p-5 dark:border-primary/10 dark:bg-surface-dark/60 backdrop-blur-md relative overflow-hidden">
            
            {/* Badge Flottant Sparkles */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-1.5">
                <Sparkles size={16} color={BRAND.primary} />
                <Text className="text-[16px] font-bold tracking-tight text-primary">
                  {t('planPremium')}
                </Text>
              </View>
              <View className="rounded-full bg-primary/10 px-2.5 py-0.5 border border-primary/20">
                <Text className="text-[10px] font-bold text-primary">
                  Recommandé
                </Text>
              </View>
            </View>

            {/* Avantages Premium énumérés */}
            <View className="gap-2.5 mb-5">
              <View className="flex-row items-center gap-2">
                <View className="h-4 w-4 rounded-full bg-primary/10 items-center justify-center">
                  <Check size={11} color={BRAND.primary} />
                </View>
                <Text className="text-[13px] font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Accès IA illimité
                </Text>
              </View>
              
              <View className="flex-row items-center gap-2">
                <View className="h-4 w-4 rounded-full bg-primary/10 items-center justify-center">
                  <Check size={11} color={BRAND.primary} />
                </View>
                <Text className="text-[13px] font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Synchronisation prioritaire
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <View className="h-4 w-4 rounded-full bg-primary/10 items-center justify-center">
                  <Check size={11} color={BRAND.primary} />
                </View>
                <Text className="text-[13px] font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Bibliothèque avancée & filtres exclusifs
                </Text>
              </View>
            </View>

            {/* Bouton d'action bientôt disponible */}
            <Button 
              label="Bientôt disponible" 
              variant="primary" 
              className="rounded-xl h-11 opacity-60" 
              onPress={() => undefined} 
              disabled 
            />
          </View>

          {/* Note d'information contextuelle discrète */}
          <View className="flex-row items-start gap-2 px-2 mt-2">
            <Info size={14} className="text-text-secondary-light/40 mt-0.5" />
            <Text className="flex-1 text-[11px] leading-[16px] font-medium text-text-secondary-light/50 dark:text-text-secondary-dark/40">
              L'abonnement Premium permettra de soutenir les infrastructures et le développement de l'application. Les fonctionnalités actuelles resteront gratuites.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
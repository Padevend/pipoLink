import { useAuth, useToast } from '@/providers';
import { paymentsApi, type PromoOffer } from '@/shared/api/payments';
import { Button } from '@/shared/ui/button';
import { router } from 'expo-router';
import { ArrowLeft, Check, Info, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SubscriptionScreen(): JSX.Element {
  const { user } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [promoCode, setPromoCode] = useState('');
  const [promoOffer, setPromoOffer] = useState<PromoOffer | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);

  const isPremium = user?.subscription?.plan === 'PREMIUM' && user?.subscription?.status === 'ACTIVE';

  const applyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoOffer(null);
      return;
    }
    setCheckingPromo(true);
    try {
      const offer = await paymentsApi.validatePromo(code);
      setPromoCode(offer.code);
      setPromoOffer(offer);
      showToast({
        type: 'success',
        message: offer.freePremiumDays > 0
          ? `${offer.freePremiumDays} jour(s) Premium seront activés.`
          : `Réduction appliquée : ${offer.discountAmount.toLocaleString('fr-FR')} XAF.`,
      });
    } catch (error: any) {
      setPromoOffer(null);
      showToast({ type: 'error', message: error.message || 'Ce code promotionnel est invalide.' });
    } finally {
      setCheckingPromo(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>

      {/* HEADER : Néo-banque, Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>

        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Abonnement
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Plans & Avantages
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }} 
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-y-6">

          {/* CARTE : PLAN GRATUIT (Arrondis 2xl, fond plein) */}
          <View className="rounded-2xl bg-zinc-100 p-6 dark:bg-[#1A1A1A]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-base font-black tracking-tight text-zinc-950 dark:text-white uppercase">
                Plan Gratuit
              </Text>
              {!isPremium && (
                <View className="rounded-full bg-white dark:bg-[#222222] px-3 py-1">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Actuel
                  </Text>
                </View>
              )}
            </View>

            {/* Avantages Free énumérés */}
            <View className="gap-y-3.5">
              <View className="flex-row items-center gap-x-3">
                <Check size={16} color="#71717A" strokeWidth={2.5} />
                <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  2 500 jetons IA disponibles à l'inscription
                </Text>
              </View>
              <View className="flex-row items-center gap-x-3">
                <Check size={16} color="#71717A" strokeWidth={2.5} />
                <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Renouvellement des jetons toutes les 6 heures
                </Text>
              </View>
              <View className="flex-row items-center gap-x-3">
                <Check size={16} color="#71717A" strokeWidth={2.5} />
                <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Accès standard à la bibliothèque (5 documents, max 5 Mo)
                </Text>
              </View>
            </View>
          </View>

          {/* CARTE : PLAN PREMIUM (Arrondis 2xl, fond plein contrasté) */}
          <View className="rounded-2xl bg-orange-500/10 dark:bg-orange-950/20 p-6 border-2 border-orange-500/30">

            {/* En-tête de l'offre */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center gap-x-2">
                <Sparkles size={18} color="#F97316" strokeWidth={2.5} />
                <Text className="text-base font-black tracking-tight text-orange-500 uppercase">
                  Plan Premium
                </Text>
              </View>
              {isPremium ? (
                <View className="rounded-full bg-orange-500 px-3 py-1">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-white">
                    Actuel
                  </Text>
                </View>
              ) : (
                <View className="rounded-full bg-orange-500 px-3 py-1">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-white">
                    Recommandé
                  </Text>
                </View>
              )}
            </View>

            {/* Avantages Premium énumérés */}
            <View className="gap-y-4 mb-6">
              <View className="flex-row items-center gap-x-3">
                <View className="h-6 w-6 rounded-full bg-orange-500 items-center justify-center">
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text className="text-xs font-bold text-zinc-950 dark:text-white">
                  2 000 jetons IA par fenêtre de restauration
                </Text>
              </View>

              <View className="flex-row items-center gap-x-3">
                <View className="h-6 w-6 rounded-full bg-orange-500 items-center justify-center">
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text className="text-xs font-bold text-zinc-950 dark:text-white">
                  Renouvellement accéléré toutes les 1h 30min
                </Text>
              </View>

              <View className="flex-row items-center gap-x-3">
                <View className="h-6 w-6 rounded-full bg-orange-500 items-center justify-center">
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text className="text-xs font-bold text-zinc-950 dark:text-white">
                  Génération d'Outils d'Étude (Résumés, Quiz, FAQ, Chronologies...)
                </Text>
              </View>

              <View className="flex-row items-center gap-x-3">
                <View className="h-6 w-6 rounded-full bg-orange-500 items-center justify-center">
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text className="text-xs font-bold text-zinc-950 dark:text-white">
                  Bibliothèque illimitée (fichiers jusqu'à 50 Mo)
                </Text>
              </View>

              <View className="flex-row items-center gap-x-3">
                <View className="h-6 w-6 rounded-full bg-orange-500 items-center justify-center">
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text className="text-xs font-bold text-zinc-950 dark:text-white">
                  Recherche sémantique dans la bibliothèque
                </Text>
              </View>
            </View>

            {!isPremium && (
              <View className="mb-6 rounded-2xl border border-orange-500/25 bg-white/70 p-4 dark:bg-[#15100d]">
                <Text className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Code promotionnel
                </Text>
                <View className="flex-row items-center gap-x-2">
                  <TextInput
                    value={promoCode}
                    onChangeText={(value) => {
                      setPromoCode(value.toUpperCase().replace(/\s+/g, ''));
                      setPromoOffer(null);
                    }}
                    onSubmitEditing={() => void applyPromo()}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="EX. RENTREE26"
                    placeholderTextColor="#A1A1AA"
                    className="h-11 flex-1 rounded-xl bg-zinc-100 px-3 text-xs font-black tracking-wider text-zinc-950 dark:bg-[#222222] dark:text-white"
                  />
                  <Pressable
                    onPress={() => void applyPromo()}
                    disabled={checkingPromo}
                    className="h-11 items-center justify-center rounded-xl bg-zinc-950 px-3 dark:bg-orange-500 disabled:opacity-50"
                  >
                    <Text className="text-[10px] font-black uppercase tracking-wider text-white">
                      {checkingPromo ? '...' : 'Appliquer'}
                    </Text>
                  </Pressable>
                </View>
                {promoOffer && (
                  <Text className="mt-3 text-xs font-bold text-orange-600 dark:text-orange-400">
                    {promoOffer.freePremiumDays > 0
                      ? `${promoOffer.freePremiumDays} jour(s) Premium offerts — aucun débit.`
                      : `Vous paierez ${promoOffer.amount.toLocaleString('fr-FR')} XAF au lieu de 2 500 XAF.`}
                  </Text>
                )}
              </View>
            )}

            {/* Bouton d'action (rounded-full) */}
            {isPremium ? (
              <Button
                label="Abonné Premium Actif"
                onPress={() => undefined}
                disabled
                size="lg"
                className="rounded-full h-14 bg-orange-500/20 text-orange-500"
              />
            ) : (
              <Button
                label="S'abonner (2 500 XAF/mois)"
                onPress={() => router.push({
                  pathname: '/settings/payment',
                  params: promoOffer ? { promoCode: promoOffer.code } : undefined,
                })}
                size="lg"
                className="rounded-full h-14 bg-orange-500 active:bg-orange-600"
              />
            )}
          </View>

          {/* Note d'information contextuelle */}
          <View className="flex-row items-start gap-x-3 px-1">
            <Info size={16} color="#A1A1AA" strokeWidth={2.5} className="mt-0.5 shrink-0" />
            <Text className="flex-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed">
              L'abonnement Premium soutient le développement de PipoLink et libère la puissance totale de l'IA Hiro pour booster votre réussite universitaire.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

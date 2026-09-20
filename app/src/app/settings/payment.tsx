import { useState, useEffect, useRef } from 'react';
import {
  Pressable,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth, useToast } from '@/providers';
import { useInitiatePayment } from '@/features/payment/hooks';
import { paymentsApi } from '@/shared/api/payments';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils/cn';
import { PhoneInput } from '@/shared/ui/phone-input';

export default function PaymentScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const initiatePayment = useInitiatePayment();

  const [operator, setOperator] = useState<'MTN' | 'ORANGE'>('MTN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleOperatorSelect = (op: 'MTN' | 'ORANGE') => {
    setOperator(op);
  };

  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
  };

  const validatePhone = (num: string): boolean => {
    return num.startsWith('+') && num.length >= 12;
  };

  const pollPaymentStatus = (id: string) => {
    attemptsRef.current = 0;

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      attemptsRef.current += 1;

      if (attemptsRef.current > 20) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setIsPending(false);
        setLoading(false);
        showToast({
          type: 'info',
          message: "Le paiement prend du temps à être traité. Vous serez notifié dès qu'il est validé.",
        });
        router.back();
        return;
      }

      try {
        const res = await paymentsApi.getStatus(id);

        if (res.status === 'SUCCESS') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsPending(false);
          setLoading(false);
          showToast({
            type: 'success',
            message: 'Abonnement Premium activé avec succès ! Profitez de Hiro en illimité.',
          });
          await refreshUser();
          router.replace('/settings/subscription');
        } else if (res.status === 'FAILED') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsPending(false);
          setLoading(false);
          showToast({
            type: 'error',
            message: 'La transaction a été rejetée ou a échoué. Veuillez réessayer.',
          });
        }
      } catch (err) {}
    }, 3000);
  };

  const handleManualCheck = async () => {
    if (!paymentId) return;
    setLoading(true);
    try {
      const res = await paymentsApi.getStatus(paymentId);

      if (res.status === 'SUCCESS') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setIsPending(false);
        showToast({
          type: 'success',
          message: 'Abonnement Premium activé avec succès !',
        });
        await refreshUser();
        router.replace('/settings/subscription');
      } else if (res.status === 'FAILED') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setIsPending(false);
        showToast({
          type: 'error',
          message: 'La transaction a échoué.',
        });
      } else {
        showToast({
          type: 'info',
          message: 'La transaction est toujours en cours de validation.',
        });
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWait = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setIsPending(false);
    setLoading(false);
  };

  const handlePaymentSubmit = async () => {
    if (!validatePhone(phoneNumber)) {
      showToast({
        type: 'error',
        message: 'Veuillez saisir un numéro de téléphone valide à 9 chiffres.',
      });
      return;
    }

    setLoading(true);
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;

    try {
      const res = await initiatePayment.mutateAsync({
        provider: operator,
        phone: formattedPhone,
      });

      if (res.status === "FAILED") {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setIsPending(false);
        setLoading(false);
        showToast({
          type: 'error',
          message: 'La transaction a été rejetée ou a échoué. Vérifiez votre solde ou votre numero et réessayer.',
        });
      } else {
        setPaymentId(res.id);
        setIsPending(true);
        pollPaymentStatus(res.id);
      }
    } catch (err: any) {
      setLoading(false);

      if (err.code === 'PAYMENT_IN_PROGRESS') {
        showToast({
          type: 'warning',
          message: 'Une transaction est déjà en cours sur votre compte. Veuillez patienter ou valider.',
        });
      } else {
        showToast({
          type: 'error',
          message: err.message || 'Impossible d\'initier la transaction. Veuillez réessayer.',
        });
      }
    }
  };

  const isValid = validatePhone(phoneNumber);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable
          onPress={() => router.back()}
          disabled={loading || isPending}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity disabled:opacity-50"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>

        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Paiement Mobile Money
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Sécurisé
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: Math.max(insets.bottom, 24) + 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* PREMIUM SUMMARY CARD (rounded-2xl) */}
          <View className="rounded-2xl bg-orange-500/10 dark:bg-orange-950/20 p-6 border-2 border-orange-500/30 mb-8">
            <View className="flex-row items-center gap-x-2.5 mb-3">
              <Sparkles size={18} color="#F97316" strokeWidth={2.5} />
              <Text className="text-base font-black tracking-tight text-orange-500 uppercase">
                PipoLink Premium
              </Text>
            </View>
            <Text className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              Accès illimité à l'IA Hiro, génération d'outils d'étude (FAQ, quiz) et bibliothèque sans limites.
            </Text>
            <View className="flex-row justify-between items-center border-t-2 border-orange-500/20 pt-4">
              <Text className="text-xs font-black uppercase tracking-widest text-zinc-500">Montant total</Text>
              <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">2 500 XAF / mois</Text>
            </View>
          </View>

          {/* OPERATOR SELECTION */}
          <View className="mb-6">
            <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3">
              Choisir votre opérateur
            </Text>
            <View className="flex-row gap-4">
              {/* MTN */}
              <Pressable
                onPress={() => handleOperatorSelect('MTN')}
                className={cn(
                  'flex-1 h-14 rounded-full border-2 items-center justify-center transition-all',
                  operator === 'MTN'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-transparent bg-zinc-100 dark:bg-[#1A1A1A]'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-black tracking-widest uppercase',
                    operator === 'MTN'
                      ? 'text-orange-500'
                      : 'text-zinc-950 dark:text-white'
                  )}
                >
                  MTN Mobile Money
                </Text>
              </Pressable>

              {/* ORANGE */}
              <Pressable
                onPress={() => handleOperatorSelect('ORANGE')}
                className={cn(
                  'flex-1 h-14 rounded-full border-2 items-center justify-center transition-all',
                  operator === 'ORANGE'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-transparent bg-zinc-100 dark:bg-[#1A1A1A]'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-black tracking-widest uppercase',
                    operator === 'ORANGE'
                      ? 'text-orange-500'
                      : 'text-zinc-950 dark:text-white'
                  )}
                >
                  Orange Money
                </Text>
              </Pressable>
            </View>
          </View>

          {/* PHONE NUMBER INPUT */}
          <View className="mb-6">
            <PhoneInput
              label="Numéro de téléphone payeur"
              onChangeE164={handlePhoneNumberChange}
              value={phoneNumber}
            />
            <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-2 leading-relaxed">
              Saisissez le numéro Mobile Money du compte qui sera débité de 2 500 XAF.
            </Text>
          </View>

          {/* INSTRUCTION CARD (rounded-2xl) */}
          <View className="rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] p-6 mb-8">
            <View className="flex-row items-center gap-x-2.5 mb-3">
              <CheckCircle2 size={16} color="#F97316" strokeWidth={2.5} />
              <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-950 dark:text-white">
                Comment valider ?
              </Text>
            </View>
            <Text className="text-xs font-bold text-zinc-600 dark:text-zinc-400 leading-relaxed">
              1. Cliquez sur le bouton "Lancer le paiement".{'\n'}
              2. Attendez l'invitation de saisie de votre code PIN secret sur votre téléphone.{'\n'}
              3. Validez la transaction.{'\n'}
              4. Votre abonnement sera instantanément activé dans l'application.
            </Text>
          </View>

          {/* SUBMIT BUTTON (rounded-full) */}
          <Button
            label="Lancer le paiement"
            onPress={handlePaymentSubmit}
            loading={loading && !isPending}
            disabled={!isValid || loading || isPending}
            size="lg"
            className={cn(
              'rounded-full h-14 w-full',
              isValid && !loading && !isPending ? 'bg-orange-500 active:bg-orange-600' : 'bg-zinc-200 dark:bg-[#222222]'
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* PENDING / VALIDATION STATUS MODAL OVERLAY (rounded-2xl) */}
      {isPending && (
        <View className="absolute inset-0 bg-black/60 z-50 items-center justify-center p-6">
          <View className="w-full max-w-[340px] rounded-2xl bg-white p-6 dark:bg-[#1A1A1A] items-center border-2 border-zinc-100 dark:border-zinc-800">
            <ActivityIndicator size="large" color="#F97316" className="mb-6" />

            <Text className="text-base font-black uppercase tracking-widest text-zinc-950 dark:text-white mb-3 text-center">
              Validation en cours
            </Text>

            <Text className="text-xs font-bold text-zinc-600 dark:text-zinc-400 text-center leading-relaxed mb-6">
              Une demande de débit de 2 500 XAF a été envoyée au numéro.{'\n\n'}
              Veuillez confirmer sur votre mobile via le pop-up USSD. Si rien n'apparaît, composez{' '}
              <Text className="font-black text-orange-500">
                {operator === 'MTN' ? '*126#' : '*150#'}
              </Text>
              .
            </Text>

            {/* ACTION BUTTONS ON OVERLAY (rounded-full) */}
            <View className="w-full gap-y-3">
              <Button
                label="J'ai validé le paiement"
                onPress={handleManualCheck}
                loading={loading}
                size="lg"
                className="rounded-full h-12 w-full bg-orange-500 active:bg-orange-600"
              />
              <Pressable
                onPress={handleCancelWait}
                disabled={loading}
                className="w-full h-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#222222] active:opacity-80 disabled:opacity-50"
              >
                <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white">
                  Retour
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
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

  // Clear polling interval on unmount
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
        // Stop after 60 seconds
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
      } catch (err) {
        
      }
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
        amount: 10,
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

        // Start polling
        pollPaymentStatus(res.id);
      }
    } catch (err: any) {
      
      setLoading(false);

      if (err.code === 'CONCURRENCY_LOCKED') {
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
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable
          onPress={() => router.back()}
          disabled={loading || isPending}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800 disabled:opacity-50"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>

        <Text className="flex-1 ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Paiement Mobile Money
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: Math.max(insets.bottom, 16) + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* PREMIUM SUMMARY CARD */}
          <View className="rounded-xl border border-orange-200 bg-orange-50/20 p-4 dark:border-orange-950/30 dark:bg-orange-950/10 mb-6">
            <View className="flex-row items-center gap-x-2 mb-2">
              <Sparkles size={16} color="#F97316" />
              <Text className="text-sm font-bold text-orange-500 dark:text-orange-400">
                PipoLink Premium
              </Text>
            </View>
            <Text className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
              Accès illimité à l'IA Hiro, génération d'outils d'étude (FAQ, quiz) et bibliothèque sans limites.
            </Text>
            <View className="flex-row justify-between items-center border-t border-orange-200/20 pt-3">
              <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Montant total</Text>
              <Text className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">1 000 XAF / mois</Text>
            </View>
          </View>

          {/* OPERATOR SELECTION */}
          <View className="mb-6">
            <Text className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2.5 pl-1">
              Choisir votre opérateur
            </Text>
            <View className="flex-row gap-3">
              {/* MTN */}
              <Pressable
                onPress={() => handleOperatorSelect('MTN')}
                className={cn(
                  'flex-1 h-14 rounded-xl border items-center justify-center transition-all',
                  operator === 'MTN'
                    ? 'border-orange-500 bg-orange-50/5 dark:bg-orange-950/10'
                    : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-black tracking-wide',
                    operator === 'MTN'
                      ? 'text-orange-500 dark:text-orange-400'
                      : 'text-zinc-500 dark:text-zinc-400'
                  )}
                >
                  MTN Mobile Money
                </Text>
              </Pressable>

              {/* ORANGE */}
              <Pressable
                onPress={() => handleOperatorSelect('ORANGE')}
                className={cn(
                  'flex-1 h-14 rounded-xl border items-center justify-center transition-all',
                  operator === 'ORANGE'
                    ? 'border-orange-500 bg-orange-50/5 dark:bg-orange-950/10'
                    : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-black tracking-wide',
                    operator === 'ORANGE'
                      ? 'text-orange-500 dark:text-orange-400'
                      : 'text-zinc-500 dark:text-zinc-400'
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
            <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 pl-1 leading-4">
              Saisissez le numéro Mobile Money du compte qui sera débité de 1 000 XAF.
            </Text>
          </View>

          {/* INSTRUCTION CARD */}
          <View className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 mb-8">
            <View className="flex-row items-center gap-x-2 mb-1.5">
              <CheckCircle2 size={13} color="#F97316" />
              <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Comment valider ?
              </Text>
            </View>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 leading-5">
              1. Cliquez sur le bouton "Lancer le paiement".{'\n'}
              2. Attendez l'invitation de saisie de votre code PIN secret sur votre téléphone.{'\n'}
              3. Validez la transaction.{'\n'}
              4. Votre abonnement sera instantanément activé dans l'application.
            </Text>
          </View>

          {/* SUBMIT BUTTON */}
          <Button
            label="Lancer le paiement"
            onPress={handlePaymentSubmit}
            loading={loading && !isPending}
            disabled={!isValid || loading || isPending}
            className={cn(
              'rounded-xl h-11 w-full',
              isValid && !loading && !isPending ? 'bg-orange-500 active:bg-orange-600' : 'bg-zinc-100 dark:bg-zinc-800'
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* PENDING / VALIDATION STATUS MODAL OVERLAY */}
      {isPending && (
        <View className="absolute inset-0 bg-black/60 z-50 items-center justify-center p-6">
          <View className="w-full max-w-[320px] rounded-2xl bg-white border border-zinc-100 p-6 dark:bg-zinc-950 dark:border-zinc-900 items-center">
            <ActivityIndicator size="large" color="#F97316" className="mb-4" />

            <Text className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mb-2 text-center">
              Validation de la transaction
            </Text>

            <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-5 mb-5">
              Une demande de débit de 1 000 XAF a été envoyée au numéro.{'\n\n'}
              Veuillez confirmer sur votre mobile via le pop-up USSD. Si rien n'apparaît, composez{' '}
              <Text className="font-bold text-orange-500">
                {operator === 'MTN' ? '*126#' : '*150#'}
              </Text>
              .
            </Text>

            {/* ACTION BUTTONS ON OVERLAY */}
            <View className="w-full gap-y-2">
              <Button
                label="J'ai validé le paiement"
                onPress={handleManualCheck}
                loading={loading}
                className="rounded-xl h-10 w-full bg-orange-500 active:bg-orange-600"
              />
              <Pressable
                onPress={handleCancelWait}
                disabled={loading}
                className="w-full h-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 active:bg-zinc-50 dark:active:bg-zinc-900 disabled:opacity-50"
              >
                <Text className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
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

import { useAuth, useToast } from '@/providers';
import { Button } from '@/shared/ui/button';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, RotateCcw, Smartphone } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

export function OTPVerify() {
  const { verifyOtp } = useAuth();
  const { showToast } = useToast();
  
  const { email, purpose } = useLocalSearchParams<{ email: string; purpose: string }>();
  
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const fullCode = codeDigits.join('');

  const handleDigitChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const newDigits = [...codeDigits];
    
    if (cleanValue.length > 1) {
      const pastedDigits = cleanValue.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedDigits[i] || '';
      }
      setCodeDigits(newDigits);
      const lastIndex = Math.min(pastedDigits.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    newDigits[index] = cleanValue;
    setCodeDigits(newDigits);

    if (cleanValue !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && codeDigits[index] === '' && index > 0) {
      const newDigits = [...codeDigits];
      newDigits[index - 1] = '';
      setCodeDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (fullCode.length !== 6) {
      showToast({ type: 'error', message: 'Veuillez saisir le code à 6 chiffres' });
      return;
    }
    
    setIsLoading(true);
    try {
      if (purpose === 'PASSWORD_RESET') {
        router.push({
          pathname: '/auth/reset-password',
          params: { email, code: fullCode }
        });
      } else {
        await verifyOtp({ 
          email: email!, 
          code: fullCode, 
          purpose: (purpose as any) || 'EMAIL_VERIFY' 
        });
        showToast({ type: 'success', message: 'Identité vérifiée avec succès !' });
        router.replace('/auth/onboarding');
      }
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Échec de la vérification' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="w-full">
      
      {/* Section Identité & En-tête Mat */}
      <View className="items-center mb-6">
        <View className="w-12 h-12 rounded-xl items-center justify-center border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 mb-4">
          <Smartphone size={20} color="#F97316" />
        </View>
        
        <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Vérification de l'email
        </Text>
        
        <Text className="text-center text-xs font-semibold leading-5 text-zinc-400 dark:text-zinc-500 mt-2 px-2">
          Un code de validation à 6 chiffres a été envoyé à l'adresse{'\n'}
          <Text className="font-bold text-zinc-900 dark:text-zinc-50">{email}</Text>
        </Text>
      </View>

      {/* Rangée des 6 Cases de Saisie Géométriques */}
      <View className="flex-row justify-between gap-x-2 mb-6">
        {codeDigits.map((digit, index) => (
          <View 
            key={index}
            className={`flex-1 h-12 rounded-xl border items-center justify-center bg-white dark:bg-zinc-950
              ${digit ? 'border-orange-500 dark:border-orange-400' : 'border-zinc-200 dark:border-zinc-800'}`}
          >
            <TextInput
              ref={(el) => (inputRefs.current[index] = el) as any}
              value={digit}
              onChangeText={(val) => handleDigitChange(val, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? 6 : 1}
              className="w-full h-full text-center text-sm font-bold text-zinc-900 dark:text-zinc-50"
              style={{ padding: 0 }}
              placeholder="0"
              placeholderTextColor="#A1A1AA"
              autoFocus={index === 0}
            />
          </View>
        ))}
      </View>

      {/* Action finale de validation */}
      <View className="mb-5">
        <Button
          label="Vérifier le code"
          onPress={() => void handleVerify()}
          loading={isLoading}
          className="bg-orange-500 rounded-xl h-11"
          disabled={fullCode.length !== 6}
          rightIcon={!isLoading ? <CheckCircle2 size={14} color="#FFFFFF" /> : undefined}
        />
      </View>

      {/* Zone de renvoi du code de sécurité */}
      <View className="items-center justify-center py-1">
        {timer > 0 ? (
          <Text className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            Renvoyer un nouveau code dans <Text className="font-bold text-orange-500 dark:text-orange-400">{timer}s</Text>
          </Text>
        ) : (
          <Pressable 
            onPress={() => setTimer(60)} 
            className="flex-row items-center gap-x-1.5 py-1"
          >
            <RotateCcw size={12} color="#F97316" />
            <Text className="text-xs font-bold text-orange-500 dark:text-orange-400">
              Renvoyer le code de vérification
            </Text>
          </Pressable>
        )}
      </View>

    </View>
  );
}
import { useAuth, useToast } from '@/providers';
import { authApi } from '@/shared/api/auth';
import { Button } from '@/shared/ui/button';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, RotateCcw } from 'lucide-react-native';
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
      <View className="mb-10">

        <Text className="text-4xl font-black text-zinc-950 dark:text-white tracking-tighter leading-[42px]">
          Vérification{"\n"}de l'email
        </Text>
        
        <Text className="text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400 mt-4">
          Un code à 6 chiffres a été envoyé à{'\n'}
          <Text className="font-black text-zinc-950 dark:text-white">{email}</Text>
        </Text>
      </View>

      <View className="flex-row justify-between gap-x-2 mb-8">
        {codeDigits.map((digit, index) => (
          <View 
            key={index}
            className={`flex-1 aspect-square rounded-[20px] border-2 items-center justify-center transition-colors
              ${digit ? 'border-orange-500 bg-white dark:bg-[#0A0A0A]' : 'border-transparent bg-zinc-100 dark:bg-[#1A1A1A]'}`}
          >
            <TextInput
              ref={(el) => (inputRefs.current[index] = el) as any}
              value={digit}
              onChangeText={(val) => handleDigitChange(val, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? 6 : 1}
              className="w-full h-full text-center text-2xl font-black text-zinc-950 dark:text-white"
              style={{ padding: 0 }}
              placeholder=""
              placeholderTextColor="#A1A1AA"
              autoFocus={index === 0}
            />
          </View>
        ))}
      </View>

      <View className="mb-8">
        <Button
          label="Vérifier le code"
          onPress={() => void handleVerify()}
          loading={isLoading}
          size="lg"
          disabled={fullCode.length !== 6}
          rightIcon={!isLoading ? <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={3} /> : undefined}
        />
      </View>

      <View className="items-center justify-center">
        {timer > 0 ? (
          <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
            Renvoyer le code dans <Text className="text-orange-500">{timer}s</Text>
          </Text>
        ) : (
          <Pressable 
            onPress={async () => {
              try {
                await authApi.resendOtp({ email: email!, purpose: (purpose as any) || 'EMAIL_VERIFY' });
                setTimer(60);
                showToast({ type: 'success', message: 'Nouveau code envoyé.' });
              } catch (e: any) {
                showToast({ type: 'error', message: e.message || 'Échec de l\'envoi' });
              }
            }} 
            className="flex-row items-center gap-x-3 py-4 px-8 rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
          >
            <RotateCcw size={16} color="#F97316" strokeWidth={2.5} />
            <Text className="text-[11px] font-black text-zinc-950 dark:text-white uppercase tracking-widest">
              Renvoyer un code
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
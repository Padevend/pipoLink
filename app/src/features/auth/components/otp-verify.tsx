import { useAuth, useToast } from '@/providers';
import { BRAND } from '@/shared/config/brand';
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

  // Références pour sauter automatiquement d'un input à l'autre
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Reconstitution du code à 6 chiffres
  const fullCode = codeDigits.join('');

  const handleDigitChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const newDigits = [...codeDigits];
    
    // Gérer le cas du copier-coller d'un code entier
    if (cleanValue.length > 1) {
      const pastedDigits = cleanValue.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedDigits[i] || '';
      }
      setCodeDigits(newDigits);
      // Mettre le focus sur la dernière case remplie
      const lastIndex = Math.min(pastedDigits.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    newDigits[index] = cleanValue;
    setCodeDigits(newDigits);

    // Sauter à la case suivante si un chiffre est entré
    if (cleanValue !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Reculer à la case précédente si touche Retour/Supprimer sur une case vide
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
      
      {/* Section Identité & En-tête */}
      <View className="items-center mb-8">
        <View 
          className="w-16 h-16 rounded-2xl items-center justify-center border border-primary/10 bg-primary/10 mb-4"
          style={{ backgroundColor: `${BRAND.primary}15`, borderColor: `${BRAND.primary}25` }}
        >
          <Smartphone size={28} color={BRAND.primary} />
        </View>
        
        <Text className="text-[22px] font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
          Vérification de l'email
        </Text>
        
        <Text className="text-center text-[13px] leading-[20px] font-medium text-text-secondary-light/70 dark:text-text-secondary-dark/60 mt-2 px-4">
          Un code de validation à 6 chiffres a été envoyé à l'adresse{'\n'}
          <Text className="font-bold text-text-primary-light dark:text-text-primary-dark">{email}</Text>
        </Text>
      </View>

      {/* Rangée des 6 Cases de Saisie (Short Inputs) */}
      <View className="flex-row justify-between gap-2 mb-8">
        {codeDigits.map((digit, index) => (
          <View 
            key={index}
            className={`flex-1 h-14 rounded-xl border items-center justify-center bg-surface-light/40 dark:bg-surface-dark/30
              ${digit ? 'border-primary/60 dark:border-primary/60' : 'border-border-light/40 dark:border-border-dark/20'}`}
          >
            <TextInput
              ref={(el) => (inputRefs.current[index] = el) as any}
              value={digit}
              onChangeText={(val) => handleDigitChange(val, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? 6 : 1}
              className="w-auto h-full text-center text-[14px] font-bold text-text-primary-light dark:text-text-primary-dark"
              style={{ padding: 0 }}
              placeholder="0"
              placeholderTextColor="#94A3B8"
              autoFocus={index === 0}
            />
          </View>
        ))}
      </View>

      {/* Action finale de validation */}
      <View className="mb-6">
        <Button
          label="Vérifier le code"
          onPress={() => void handleVerify()}
          loading={isLoading}
          size="xl"
          className="rounded-xl h-12"
          disabled={fullCode.length !== 6}
          rightIcon={!isLoading ? <CheckCircle2 size={16} color="#FFFFFF" /> : undefined}
        />
      </View>

      {/* Zone de renvoi du code de sécurité */}
      <View className="items-center justify-center py-2">
        {timer > 0 ? (
          <Text className="text-[12px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60">
            Renvoyer un nouveau code dans <Text className="font-bold text-primary" style={{ color: BRAND.primary }}>{timer}s</Text>
          </Text>
        ) : (
          <Pressable 
            onPress={() => setTimer(60)} 
            className="flex-row items-center gap-1.5 active:opacity-70 py-1"
          >
            <RotateCcw size={13} color={BRAND.primary} />
            <Text className="text-[13px] font-bold text-primary" style={{ color: BRAND.primary }}>
              Renvoyer le code de vérification
            </Text>
          </Pressable>
        )}
      </View>

    </View>
  );
}
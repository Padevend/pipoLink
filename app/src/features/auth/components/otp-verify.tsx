import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAuth } from '@/providers';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useToast } from '@/shared/hooks/use-toast';
import { Smartphone } from 'lucide-react-native';

export function OTPVerify() {
  const { verifyOtp } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const { email, purpose } = useLocalSearchParams<{ email: string; purpose: string }>();
  
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      showToast({ type: 'error', message: 'Please enter the 6-digit code' });
      return;
    }
    
    setIsLoading(true);
    try {
      if (purpose === 'PASSWORD_RESET') {
        // For password reset, we just verify the code and move to reset screen
        // In a real app, you might want to exchange the code for a temporary reset token
        router.push({
          pathname: '/auth/reset-password',
          params: { email, code }
        });
      } else {
        await verifyOtp({ 
          email: email!, 
          code, 
          purpose: (purpose as any) || 'EMAIL_VERIFY' 
        });
        showToast({ type: 'success', message: 'Identity verified!' });
        router.replace('/auth/onboarding');
      }
    } catch (e: any) {
      console.log(e)
      showToast({ type: 'error', message: e.message || 'Verification failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="w-full gap-8">
      <View className="items-center gap-4">
        <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
          <Smartphone size={32} color="#FF7A00" />
        </View>
        <View className="items-center gap-2">
          <Text className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Verify Email
          </Text>
          <Text className="text-center text-text-secondary-light dark:text-text-secondary-dark px-6">
            We've sent a 6-digit code to{'\n'}
            <Text className="font-bold text-text-primary-light dark:text-text-primary-dark">{email}</Text>
          </Text>
        </View>
      </View>

      <View className="gap-6">
        <Input
          placeholder="000000"
          value={code}
          onChangeText={(val) => setCode(val.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          className="text-center text-3xl tracking-[10px] font-bold h-20"
          autoFocus
        />

        <Button
          label="Verify Code"
          onPress={handleVerify}
          loading={isLoading}
          size="xl"
          disabled={code.length !== 6}
        />
      </View>

      <View className="items-center gap-2">
        {timer > 0 ? (
          <Text className="text-text-secondary-light dark:text-text-secondary-dark">
            Resend code in <Text className="font-bold text-primary">{timer}s</Text>
          </Text>
        ) : (
          <Pressable onPress={() => setTimer(60)}>
            <Text className="font-bold text-primary">Resend Verification Code</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

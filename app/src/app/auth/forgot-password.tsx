import React, { useState } from 'react';
import { View, Text, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { ChevronLeft, Mail, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { authApi } from '@/shared/api/auth';
import { useToast } from '@/shared/hooks/use-toast';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      showToast({
        type: 'success',
        message: 'Reset code sent to your email.'
      });
      router.push({
        pathname: '/auth/verify-otp',
        params: { email, purpose: 'PASSWORD_RESET' }
      });
    } catch (e: any) {
      showToast({
        type: 'error',
        message: e.message || 'Failed to send reset code'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center px-4 py-2">
        <Pressable 
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark"
        >
          <ChevronLeft size={24} color="#111827" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6 pt-10">
        <View className="mb-10">
          <Text className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark">
            Reset Password
          </Text>
          <Text className="text-text-secondary-light dark:text-text-secondary-dark mt-2 leading-6">
            Enter your email address and we'll send you a code to reset your password.
          </Text>
        </View>

        <View className="gap-8">
          <Input 
            label="Email Address"
            placeholder="student@university.edu"
            value={email}
            onChangeText={setEmail}
            leftIcon={Mail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button 
            label="Send Reset Code"
            onPress={handleReset}
            loading={isLoading}
            size="xl"
            leftIcon={<Send size={20} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

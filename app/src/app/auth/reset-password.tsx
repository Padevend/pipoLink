import React, { useState } from 'react';
import { View, Text, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { authApi } from '@/shared/api/auth';
import { useToast } from '@/shared/hooks/use-toast';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!password || password !== confirmPassword) {
      showToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    
    setIsLoading(true);
    try {
      await authApi.resetPassword({ email: email!, code: code!, newPassword: password });
      showToast({ type: 'success', message: 'Password reset successful!' });
      router.replace('/auth/login');
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Failed to reset password' });
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
            New Password
          </Text>
          <Text className="text-text-secondary-light dark:text-text-secondary-dark mt-2 leading-6">
            Create a new password for your account.
          </Text>
        </View>

        <View className="gap-6">
          <Input 
            label="New Password"
            placeholder="Min 8 characters"
            value={password}
            onChangeText={setPassword}
            leftIcon={Lock}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? EyeOff : Eye}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Input 
            label="Confirm Password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            leftIcon={Lock}
            secureTextEntry={!showPassword}
          />

          <Button 
            label="Reset Password"
            onPress={handleReset}
            loading={isLoading}
            size="xl"
            className="mt-4"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React from 'react';
import { View, SafeAreaView, Pressable } from 'react-native';
import { OTPVerify } from '@/features/auth/components/otp-verify';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function VerifyOtpScreen() {
  const router = useRouter();

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
      
      <View className="flex-1 px-6 pt-10">
        <OTPVerify />
      </View>
    </SafeAreaView>
  );
}

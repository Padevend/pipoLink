import React from 'react';
import { View, Text, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { RegisterForm } from '@/features/auth/components/register-form';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
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
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-4 pb-8">
          <View className="mb-10">
            <Text className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark">
              Create Account
            </Text>
            <Text className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
              Join thousands of students in a smarter academic community.
            </Text>
          </View>

          <RegisterForm />
          
          <View className="mt-8 px-6">
            <Text className="text-center text-xs text-text-secondary-light dark:text-text-secondary-dark leading-5">
              By creating an account, you agree to our{' '}
              <Text className="text-primary font-bold">Terms of Service</Text> and{' '}
              <Text className="text-primary font-bold">Privacy Policy</Text>.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

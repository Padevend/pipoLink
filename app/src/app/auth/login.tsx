import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { LoginForm } from '@/features/auth/components/login-form';
import { Image } from 'expo-image';

export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-12 pb-8 justify-center">
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-primary rounded-[24px] items-center justify-center shadow-xl shadow-primary/40 mb-6">
              <Text className="text-white text-4xl font-black">P</Text>
            </View>
            <Text className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark">
              Welcome to PipoLink
            </Text>
            <Text className="text-text-secondary-light dark:text-text-secondary-dark mt-2 text-center px-4">
              The secure workspace for students and academic collaboration.
            </Text>
          </View>

          <LoginForm />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

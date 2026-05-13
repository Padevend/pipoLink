import React from 'react';
import { View, Text, SafeAreaView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/shared/ui/button';
import { Shield, X } from 'lucide-react-native';

/**
 * Confirmation visuelle après liaison (le lien est déjà effectué depuis l’écran Scanner).
 */
export default function DeviceConfirmModal() {
  const { name } = useLocalSearchParams<{ qrToken?: string; name?: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center justify-between border-b border-border-light px-6 py-4 dark:border-border-dark">
        <Text className="text-xl font-black text-text-primary-light dark:text-text-primary-dark">Appareil lié</Text>
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <X size={20} color="#6B7280" />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center gap-10 px-6">
        <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-primary/10">
          <Shield size={48} color="#FF7A00" />
        </View>
        <Text className="text-center text-text-secondary-light dark:text-text-secondary-dark">
          L’appareil <Text className="font-bold text-text-primary-light dark:text-text-primary-dark">{name || 'nouveau'}</Text> a été associé à votre compte.
        </Text>
        <Button label="Fermer" onPress={() => router.back()} size="xl" />
      </View>
    </SafeAreaView>
  );
}

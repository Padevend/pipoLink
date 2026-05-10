import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { Header } from '@/shared/ui/header';

export default function NewMessageScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Nouveau message" subtitle="Démarrer une nouvelle conversation" />
      <View className="flex-1 items-center justify-center">
        <Text className="text-slate-500 dark:text-slate-400">Sélection de contact en cours de construction</Text>
      </View>
    </SafeAreaView>
  );
}

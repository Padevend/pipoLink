import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { Header } from '@/shared/ui/header';

export default function SearchScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Recherche" subtitle="Trouver des messages ou des fichiers" />
      <View className="flex-1 items-center justify-center">
        <Text className="text-slate-500 dark:text-slate-400">Recherche globale en cours de construction</Text>
      </View>
    </SafeAreaView>
  );
}

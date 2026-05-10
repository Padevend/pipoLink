import { Text, View } from 'react-native';

import { Header } from '@/shared/ui/header';

export default function AboutScreen(): JSX.Element {
  return (
    <View className="flex-1 bg-slate-50 px-4 py-6 dark:bg-slate-950">
      <Header title="À propos" subtitle="PipoLink" />
      <View className="rounded-3xl bg-white p-4 dark:bg-slate-900">
        <Text className="text-slate-900 dark:text-white">Version 1.0.0</Text>
        <Text className="mt-2 text-slate-500 dark:text-slate-400">Application mobile sécurisée, offline-first et temps réel.</Text>
      </View>
    </View>
  );
}

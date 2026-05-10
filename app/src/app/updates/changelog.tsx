import { ScrollView, Text, View } from 'react-native';

import { useOtaUpdate } from '@/features/updates/hooks/use-ota-update';
import { Header } from '@/shared/ui/header';
import { Loader } from '@/shared/ui/loader';

export default function ChangelogScreen(): JSX.Element {
  const { data, isLoading } = useOtaUpdate();

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Changelog" subtitle="Historique des versions" />
      <View className="px-4 py-4 gap-3">
        {isLoading ? <Loader /> : null}
        {data ? (
          <View className="rounded-3xl bg-white p-4 dark:bg-slate-900">
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">Version {data.version}</Text>
            {data.changelog?.map((item) => (
              <Text key={item} className="mt-2 text-slate-600 dark:text-slate-300">• {item}</Text>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

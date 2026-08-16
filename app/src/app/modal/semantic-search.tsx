import { router } from 'expo-router';
import { Book, BookOpen, FileText, Search, Sparkles, Wrench, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSemanticSearch } from '@/entities/document/hooks';
import { Input } from '@/shared/ui/input';

export default function SemanticSearchModal() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const semanticSearch = useSemanticSearch();

  const result = semanticSearch.data;
  const uniqueResults = Array.from(
    new Map((result?.results ?? []).map((item) => [item.document_id, item])).values(),
  );
  const canSubmit = query.trim().length >= 3 && !semanticSearch.isPending;

  const handleSearch = () => {
    if (!canSubmit) return;
    semanticSearch.mutate(query.trim(), {
      onError: (err: any) => {
        if (err?.code === 'PREMIUM_REQUIRED') {
          router.replace('/settings/subscription' as never);
        }
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View className="flex-row items-center justify-between border-b border-zinc-100 bg-white px-5 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <View className="flex-row items-center gap-2">
          <BookOpen size={15} color="#F97316" />
          <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Recherche IA
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <X size={14} color="#71717A" />
        </Pressable>
      </View>

      <View className="px-4 pt-4">
        <Input
          placeholder="ex. document sur les lois de Maxwell en thermodynamique"
          value={query}
          onChangeText={setQuery}
          leftIcon={Search}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          containerClassName="bg-transparent border-0 px-2 h-12"
          className="text-xs p-4 text-zinc-900 dark:text-zinc-50"
        />

        <Pressable
          onPress={handleSearch}
          disabled={!canSubmit}
          className="mt-3 h-11 items-center justify-center rounded-xl bg-orange-500 active:bg-orange-600 disabled:opacity-50"
        >
          {semanticSearch.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-xs font-bold uppercase tracking-wider text-white">
              Rechercher
            </Text>
          )}
        </Pressable>
      </View>

      <View className="flex-1 px-4 pt-4">
        {/* Message serveur (l'app ne connaît pas l'état du service : elle affiche ce qu'il envoie) */}
        {result?.message ? (
          <View className="items-center justify-center py-20 px-6">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 mb-3">
              <Wrench size={20} color="#F97316" />
            </View>
            <Text className="mt-1 text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400 px-6">
              {result.message}
            </Text>
          </View>
        ) : (
          <FlatList
            data={uniqueResults}
            keyExtractor={(item) => item.document_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            ItemSeparatorComponent={() => <View className="h-2" />}
            ListEmptyComponent={
              result && !semanticSearch.isPending ? (
                <View className="items-center justify-center py-20 px-6">
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 mb-3">
                    <FileText size={20} color="#F97316" />
                  </View>
                  <Text className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-200 text-center">
                    Aucun résultat
                  </Text>
                  <Text className="mt-1 text-center text-xs leading-4 text-zinc-400 dark:text-zinc-500 px-6">
                    Aucun document ne correspond à votre question. Reformulez ou essayez d'autres termes.
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/library/document/[id]',
                    params: { id: item.document_id },
                  } as never)
                }
                className="rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-900 dark:bg-zinc-900/40 active:bg-zinc-100 dark:active:bg-zinc-900"
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    numberOfLines={1}
                    className="flex-1 pr-3 text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                  >
                    {item.title}
                  </Text>
                  <View className="rounded bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5">
                    <Text className="text-[9px] font-bold tracking-wider text-orange-700 dark:text-orange-400">
                      {Math.round((item.score ?? 0) * 100)}%
                    </Text>
                  </View>
                </View>
                {item.excerpt ? (
                  <Text
                    numberOfLines={2}
                    className="mt-1.5 text-[11px] leading-4 text-zinc-500 dark:text-zinc-400"
                  >
                    {item.excerpt}
                  </Text>
                ) : null}
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

import { router } from 'expo-router';
import { BookOpen, FileText, Search, Wrench, X } from 'lucide-react-native';
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
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center justify-between border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A]">
            <BookOpen size={18} color="#F97316" strokeWidth={2.5} />
          </View>
          <View className="justify-center">
            <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
              Recherche IA
            </Text>
            <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
              Recherche sémantique
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <X size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>
      </View>

      <View className="px-6 pt-6">
        <Input
          placeholder="ex. document sur les lois de Maxwell..."
          placeholderTextColor="#A1A1AA"
          value={query}
          onChangeText={setQuery}
          leftIcon={Search}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          containerClassName="bg-zinc-100 border-0 dark:bg-[#1A1A1A] rounded-full h-14 px-5"
          className="text-sm font-bold text-zinc-950 dark:text-white"
        />

        <Pressable
          onPress={handleSearch}
          disabled={!canSubmit}
          className="mt-4 h-14 items-center justify-center rounded-full bg-orange-500 active:opacity-80 disabled:opacity-40"
        >
          {semanticSearch.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-xs font-black uppercase tracking-widest text-white">
              Rechercher
            </Text>
          )}
        </Pressable>
      </View>

      <View className="flex-1 px-6 pt-6">
        {result?.message ? (
          <View className="items-center justify-center py-20 px-6 rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-[#222222] mb-4">
              <Wrench size={24} color="#F97316" strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
              Information
            </Text>
            <Text className="mt-2 text-center text-xs font-bold leading-relaxed text-zinc-500 dark:text-zinc-400">
              {result.message}
            </Text>
          </View>
        ) : (
          <FlatList
            data={uniqueResults}
            keyExtractor={(item) => item.document_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            ItemSeparatorComponent={() => <View className="h-3" />}
            ListEmptyComponent={
              result && !semanticSearch.isPending ? (
                <View className="items-center justify-center py-20 px-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-[#1A1A1A] bg-zinc-50 dark:bg-[#0A0A0A]">
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-4">
                    <FileText size={24} color="#F97316" strokeWidth={2.5} />
                  </View>
                  <Text className="text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
                    Aucun résultat
                  </Text>
                  <Text className="mt-2 text-center text-xs font-bold leading-relaxed text-zinc-500 dark:text-zinc-400">
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
                className="rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] p-5 active:opacity-80 transition-opacity"
              >
                <View className="flex-row items-center justify-between gap-3">
                  <Text
                    numberOfLines={1}
                    className="flex-1 text-sm font-bold tracking-tight text-zinc-950 dark:text-white"
                  >
                    {item.title}
                  </Text>
                  <View className="rounded-full bg-white dark:bg-[#222222] px-3 py-1">
                    <Text className="text-[10px] font-black tracking-widest text-orange-500">
                      {Math.round((item.score ?? 0) * 100)}%
                    </Text>
                  </View>
                </View>
                {item.excerpt ? (
                  <Text
                    numberOfLines={2}
                    className="mt-2 text-xs font-bold leading-relaxed text-zinc-500 dark:text-zinc-400"
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
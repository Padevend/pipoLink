import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, Plus } from 'lucide-react-native';

import { useAnnouncements } from '@/entities/announcement/hooks';
import { useAuth } from '@/providers';
import { Header } from '@/shared/ui/header';
import { Skeleton } from '@/shared/ui/skeleton';

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: announcements, isLoading, refetch, isRefetching } = useAnnouncements();

  const isStaff = user?.role === 'admin' || user?.role === 'staff';

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center border-b border-border-light px-2 dark:border-border-dark">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
          <ChevronLeft size={24} color="#111827" />
        </Pressable>
        <View className="flex-1">
          <Header title="Annonces" />
        </View>
        {isStaff ? (
          <Pressable
            onPress={() => router.push('/announcements/new')}
            className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-primary"
          >
            <Plus size={22} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>

      {isLoading ? (
        <View className="gap-3 p-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            <View className="items-center py-24">
              <Text className="text-center text-text-secondary-light dark:text-text-secondary-dark">
                Aucune annonce pour le moment.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="mb-4 rounded-3xl border border-border-light bg-surface-light p-5 dark:border-border-dark dark:bg-surface-dark">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="flex-1 text-lg font-black text-text-primary-light dark:text-text-primary-dark">
                  {item.title}
                </Text>
              </View>
              {item.author?.username ? (
                <Text className="mb-2 text-xs font-semibold text-primary">
                  {item.author.username}
                </Text>
              ) : null}
              <Text className="text-[15px] leading-6 text-text-primary-light dark:text-text-primary-dark">
                {item.content}
              </Text>
              <Text className="mt-3 text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                {format(new Date(item.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

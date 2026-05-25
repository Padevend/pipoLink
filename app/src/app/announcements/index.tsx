import { router } from 'expo-router';
import {
  ArrowLeft,
  Megaphone,
  Plus
} from 'lucide-react-native';
import {
  FlatList,
  Pressable,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAnnouncements } from '@/entities/announcement/hooks';
import AnnouncementCard from '@/features/announcements/components/announcement-card';
import SkeletonCard from '@/features/announcements/components/skeleton-card';
import { useAuth } from '@/providers';
import { BRAND } from '@/shared/config/brand';

// Screen: AnnouncementsScreen
export default function AnnouncementsScreen() {
  const { user } = useAuth();
  const { data: announcements, isLoading, refetch, isRefetching } = useAnnouncements();
  const isStaff = user?.role === 'admin' || user?.role === 'staff';

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>

      {/* HEADER PANELS */}
      <View className="z-10 flex-row items-center justify-between border-b border-border-light/40 bg-surface-light/75 px-4 py-3 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <View className="flex-row items-center flex-1 gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} color="#64748B" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-[16px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              Annonces
            </Text>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-text-secondary-light/40 dark:text-text-secondary-dark/40 mt-0.5">
              Actualités Universitaires
            </Text>
          </View>
        </View>

        {isStaff && (
          <Pressable
            onPress={() => router.push('/announcements/new')}
            hitSlop={4}
            className="h-9 w-9 items-center justify-center rounded-xl active:scale-95 transition-transform"
            style={{ backgroundColor: BRAND.primary }}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        )}
      </View>

      {/* BODY SCREEN LIST */}
      {isLoading ? (
        <View className="px-4 pt-4 gap-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-40 gap-y-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-text-secondary-light/5 border border-border-light/10">
                <Megaphone size={20} className="text-text-secondary-light/40 dark:text-text-secondary-dark/40" strokeWidth={1.5} />
              </View>
              <Text className="text-[13px] font-semibold text-center text-text-secondary-light/50 dark:text-text-secondary-dark/50">
                Aucune annonce pour le moment.
              </Text>
            </View>
          }
          renderItem={({ item }) => <AnnouncementCard item={item as any} />}
        />
      )}
    </SafeAreaView>
  );
}
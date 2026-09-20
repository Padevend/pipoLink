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

export default function AnnouncementsScreen() {
  const { user } = useAuth();
  const { data: announcements, isLoading, refetch, isRefetching } = useAnnouncements();
  const isStaff = user?.role === 'admin' || user?.role === 'staff';

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top']}>

      {/* HEADER : Néo-banque Plat et Solide */}
      <View className="flex-row items-center justify-between border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <View className="flex-row items-center flex-1 gap-4">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
          </Pressable>

          <View className="flex-1 justify-center">
            <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
              Annonces
            </Text>
            <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
              Établissement
            </Text>
          </View>
        </View>

        {/* Bouton Créer (rounded-full) visible uniquement pour le personnel */}
        {isStaff && (
          <Pressable
            onPress={() => router.push('/announcements/new')}
            className="h-12 w-12 items-center justify-center rounded-full bg-orange-500 active:opacity-80 transition-opacity"
          >
            <Plus size={22} color="#FFFFFF" strokeWidth={3} />
          </Pressable>
        )}
      </View>

      {/* LISTE DES ANNONCES */}
      {isLoading ? (
        <View className="px-6 pt-6 gap-y-3">
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6 mt-6">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-5">
                <Megaphone size={24} color="#F97316" strokeWidth={2.5} />
              </View>
              <Text className="text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
                Aucune annonce
              </Text>
              <Text className="text-xs font-bold text-center text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Il n'y a aucune actualité à afficher pour le moment.
              </Text>
            </View>
          }
          renderItem={({ item }) => <AnnouncementCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}
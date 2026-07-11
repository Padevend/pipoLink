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
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>

      {/* EN-TÊTE DE LA PAGE (Simple, clair et accueillant) */}
      <View className="flex-row items-center justify-between border-b border-zinc-100 bg-white px-4 py-4 dark:border-zinc-900 dark:bg-zinc-900">
        <View className="flex-row items-center flex-1 gap-3">
          {/* Bouton retour plus accessible et doux au toucher */}
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-9 w-9 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 active:opacity-70"
          >
            <ArrowLeft size={18} color="#71717A" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Annonces
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Les dernières actualités de votre établissement
            </Text>
          </View>
        </View>

        {/* Bouton pour ajouter une annonce (visible uniquement pour le personnel) */}
        {isStaff && (
          <Pressable
            onPress={() => router.push('/announcements/new')}
            hitSlop={8}
            className="flex-row items-center justify-center h-9 px-3 rounded-xl bg-orange-500 active:bg-orange-600"
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={2.5} className="mr-1" />
            <Text className="text-white text-xs font-semibold">Créer</Text>
          </Pressable>
        )}
      </View>

      {/* LISTE DES ANNONCES */}
      {isLoading ? (
        // Écran d'attente pendant le chargement
        <View className="px-4 pt-4 gap-y-3">
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
          // Message affiché si la liste est vide
          ListEmptyComponent={
            <View className="items-center justify-center py-32 px-6">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 mb-4">
                <Megaphone size={24} color="#A1A1AA" strokeWidth={1.5} />
              </View>
              <Text className="text-sm font-medium text-center text-zinc-500 dark:text-zinc-400">
                Il n'y a aucune annonce à afficher pour le moment.
              </Text>
            </View>
          }
          renderItem={({ item }) => <AnnouncementCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}
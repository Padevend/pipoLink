import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Directory, File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
  ArrowLeft,
  Calendar,
  Download,
  Megaphone,
  Plus,
  Share2,
  User,
  X
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  Share,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAnnouncements } from '@/entities/announcement/hooks';
import { useAuth, useToast } from '@/providers';
import { Announcement } from '@/shared/api/announcements';
import { BRAND } from '@/shared/config/brand';
import { getStaticUri } from '@/shared/lib/static';
import { Skeleton } from '@/shared/ui/skeleton';
import { deleteAsync } from 'expo-file-system/legacy';

// Registre de mémoire global pour conserver les états HD téléchargés lors de la renavigation
const MEMORY_POSTER_CACHE: Record<string, { uri: string; state: 'done' }> = {};

// Component: AnnouncementCard
function AnnouncementCard({ item }: { item: Announcement }) {
  const [posterUri, setPosterUri] = useState<string | null>(MEMORY_POSTER_CACHE[item.id]?.uri || null);
  const [hdState, setHdState] = useState<'idle' | 'loading' | 'done'>(MEMORY_POSTER_CACHE[item.id]?.state || 'idle');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageRatio, setImageRatio] = useState<number>(16 / 9); // Ratio par défaut sûr

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { showToast } = useToast();

  const previewUrl = item.previewUrl ? getStaticUri(item.previewUrl) : null;
  const posterUrl = item.poster ? getStaticUri(item.poster) : null;
  const displayedImage = posterUri ?? previewUrl;
  const hasImage = !!displayedImage;

  // Calcul dynamique de la taille réelle de l'image reçue pour éliminer les limites de hauteur
  useEffect(() => {
    if (displayedImage) {
      Image.getSize(
        displayedImage,
        (width, height) => {
          if (width && height) {
            setImageRatio(width / height);
          }
        },
        () => {}
      );
    }
  }, [displayedImage]);

  const downloadPoster = useCallback(async () => {
    if (!posterUrl || hdState !== 'idle') return;
    setHdState('loading');
    try {
      const dir = new Directory(Paths.cache, 'posters');
      if (!dir.exists) {
        dir.create();
      }

      const fileTarget = new File(dir, `poster_${item.id}.webp`);
      if (fileTarget.exists) {
        await deleteAsync(fileTarget.uri, { idempotent: true });
      }

      const output = await File.downloadFileAsync(posterUrl, fileTarget, {
        headers: {
          'User-Agent': 'PipoLink/1.0 (Mobile; Expo)',
        }
      });

      // Stockage en mémoire locale du composant et dans le cache global persistant
      setPosterUri(output.uri);
      setHdState('done');
      MEMORY_POSTER_CACHE[item.id] = { uri: output.uri, state: 'done' };
    } catch (e) {
      setHdState('idle');
      showToast({
        type: "warning",
        message: "Échec du téléchargement de l'image haute définition."
      });
    }
  }, [posterUrl, hdState, item.id, showToast]);

  const handleShare = useCallback(async () => {
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Partage', "Le partage n'est pas disponible sur cet appareil.");
        return;
      }

      const localFile = posterUri ?? null;
      if (localFile) {
        await Sharing.shareAsync(localFile, {
          dialogTitle: item.title,
          mimeType: 'image/webp',
        });
      } else if (previewUrl) {
        const dir = new Directory(Paths.cache, 'share_tmp');
        if (!dir.exists) {
          dir.create();
        }
        
        const tempShareFile = new File(dir, `share_${item.id}.webp`);
        if (tempShareFile.exists) {
          await deleteAsync(tempShareFile.uri, { idempotent: true });
        }

        const out = await File.downloadFileAsync(previewUrl, tempShareFile);
        await Share.share({
          message: `${item.title}\n\n${item.content}`,
          url: out.uri
        });
      } else {
        await Share.share({
          message: `${item.title}\n\n${item.content}`
        });
      }
    } catch {}
  }, [posterUri, previewUrl, item]);

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.99, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 16 }}>
      <View className="overflow-hidden rounded-xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
        
        {/* HERO MEDIA BLOCK (HAUTEUR UNIQUE ADAPTATIVE) */}
        {hasImage && (
          <View className="relative w-full bg-text-secondary-light/5">
            <Pressable 
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={() => setIsPreviewOpen(true)}
              style={{ width: '100%', aspectRatio: imageRatio }}
            >
              <Image
                source={{ uri: displayedImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </Pressable>

            <View className="absolute inset-0 pointer-events-none bg-black/5 dark:bg-black/10" />

            {/* Statut de téléchargement HD */}
            {posterUrl && hdState !== 'done' && (
              <Pressable
                onPress={downloadPoster}
                hitSlop={8}
                className="absolute top-3 right-3 flex-row items-center gap-x-1.5 rounded-lg border border-white/20 bg-black/50 px-2.5 py-1.5 backdrop-blur-md active:scale-95 transition-transform"
              >
                {hdState === 'loading' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" className="scale-75" />
                ) : (
                  <Download size={12} color="#FFFFFF" strokeWidth={2.5} />
                )}
                <Text className="text-[10px] font-bold tracking-wider text-white uppercase">
                  {hdState === 'loading' ? 'HD…' : 'Charger HD'}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* CARD BODY CONTENT */}
        <Pressable onPressIn={onPressIn} onPressOut={onPressOut} className="p-4">
          {item.author?.username && (
            <View className="flex-row items-center gap-1.5 mb-2.5">
              <View
                className="h-5 w-5 rounded-md items-center justify-center"
                style={{ backgroundColor: `${BRAND.primary}12` }}
              >
                <User size={11} color={BRAND.primary} strokeWidth={2.5} />
              </View>
              <Text className="text-[11px] font-bold uppercase tracking-wider" style={{ color: BRAND.primary }}>
                {item.author.username}
              </Text>
            </View>
          )}

          <Text className="text-[15px] font-bold leading-5 tracking-tight text-text-primary-light dark:text-text-primary-dark mb-2">
            {item.title}
          </Text>

          <Text className="text-[13px] leading-[20px] text-text-primary-light/80 dark:text-text-primary-dark/80 font-medium">
            {item.content}
          </Text>

          <View className="my-3.5 h-[0.5px] bg-border-light/20 dark:bg-border-dark/10" />

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Calendar size={11} color="#64748B" />
              <Text className="text-[11px] font-medium text-text-secondary-light/40 dark:text-text-secondary-dark/50">
                {format(new Date(item.createdAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}
              </Text>
            </View>

            <Pressable
              onPress={handleShare}
              className="flex-row items-center gap-x-1.5 px-2.5 py-1.5 rounded-lg border border-border-light/40 bg-surface-light dark:border-border-dark/20 dark:bg-surface-dark active:scale-95 transition-transform"
            >
              <Share2 size={12} color="#64748B" strokeWidth={2} />
              <Text className="text-[11px] font-bold text-text-secondary-light/60 dark:text-text-secondary-dark/60">
                Partager
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </View>

      {/* MODAL POUR L'OUVERTURE DE L'IMAGE EN PLEIN ÉCRAN */}
      {hasImage && (
        <Modal
          visible={isPreviewOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsPreviewOpen(false)}
        >
          <View className="flex-1 bg-black/95 justify-center items-center relative">
            <Pressable 
              onPress={() => setIsPreviewOpen(false)}
              className="absolute top-12 right-4 h-10 w-10 z-50 items-center justify-center rounded-full bg-white/10 border border-white/10 active:scale-90"
            >
              <X size={20} color="#FFFFFF" />
            </Pressable>
            
            <Pressable className="w-full h-full justify-center items-center" onPress={() => setIsPreviewOpen(false)}>
              <Image
                source={{ uri: displayedImage }}
                className="w-full"
                style={{ aspectRatio: imageRatio }}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </Modal>
      )}
    </Animated.View>
  );
}

// Component: SkeletonCard
function SkeletonCard() {
  return (
    <View className="mb-4 rounded-xl overflow-hidden border border-border-light/40 bg-surface-light/30 dark:border-border-dark/20 dark:bg-surface-dark/20 p-4 gap-3">
      <Skeleton className="min-h-4 w-1/3 rounded-md opacity-60" />
      <Skeleton className="min-h-6 w-3/4 rounded-md" />
      <Skeleton className="min-h-4 w-full rounded-md opacity-80" />
      <Skeleton className="min-h-4 w-5/6 rounded-md opacity-80" />
    </View>
  );
}

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
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
    Calendar,
    Download,
    Share2,
    User
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Pressable,
    Share,
    Text,
    View
} from 'react-native';

import { useToast } from '@/providers';
import { Announcement } from '@/shared/api/announcements';
import { getStaticUri } from '@/shared/lib/static';
import { ImageViewer } from '@/shared/ui/image-viewer';
import { deleteAsync } from 'expo-file-system/legacy';

const MEMORY_POSTER_CACHE: Record<string, { uri: string; state: 'done' }> = {};

export default function AnnouncementCard({ item }: { item: Announcement }) {
  const [posterUri, setPosterUri] = useState<string | null>(MEMORY_POSTER_CACHE[item.id]?.uri || null);
  const [hdState, setHdState] = useState<'idle' | 'loading' | 'done'>(MEMORY_POSTER_CACHE[item.id]?.state || 'idle');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageRatio, setImageRatio] = useState<number>(16 / 9);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { showToast } = useToast();

  const previewUrl = item.previewUrl ? getStaticUri(item.previewUrl) : null;
  const posterUrl = item.poster ? getStaticUri(item.poster) : null;
  const displayedImage = posterUri ?? previewUrl;
  const hasImage = !!displayedImage;

  // Calcul automatique des dimensions de l'image pour un affichage parfait
  useEffect(() => {
    if (displayedImage) {
      Image.getSize(
        displayedImage,
        (width, height) => {
          if (width && height) {
            setImageRatio(width / height);
          }
        },
        () => { }
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

      setPosterUri(output.uri);
      setHdState('done');
      MEMORY_POSTER_CACHE[item.id] = { uri: output.uri, state: 'done' };
    } catch (e) {
      setHdState('idle');
      showToast({
        type: "warning",
        message: "Impossible de charger la photo en haute qualité pour le moment."
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
    } catch { }
  }, [posterUri, previewUrl, item]);

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.99, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 16 }}>
      <View className="overflow-hidden rounded-xl border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-900">

        {/* IMAGE D'ILLUSTRATION DE L'ANNONCE */}
        {hasImage && (
          <View className="relative w-full bg-zinc-50 dark:bg-zinc-950">
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

            {/* Bouton pour activer la haute définition */}
            {posterUrl && hdState !== 'done' && (
              <Pressable
                onPress={downloadPoster}
                hitSlop={8}
                className="absolute top-3 right-3 flex-row items-center gap-x-1.5 rounded-lg bg-zinc-950 px-3 py-1.5 active:opacity-80"
              >
                {hdState === 'loading' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" className="scale-75" />
                ) : (
                  <Download size={12} color="#FFFFFF" strokeWidth={2.5} />
                )}
                <Text className="text-xs font-semibold text-white">
                  {hdState === 'loading' ? 'Amélioration...' : 'Voir en haute qualité'}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* CONTENU DE LA CARTE */}
        <Pressable onPressIn={onPressIn} onPressOut={onPressOut} className="p-4">
          
          {/* Nom de l'auteur de l'annonce */}
          {item.author?.username && (
            <View className="flex-row items-center gap-1.5 mb-2">
              <View className="h-5 w-5 rounded-md items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                <User size={12} color="#71717A" strokeWidth={2.5} />
              </View>
              <Text className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                {item.author.username}
              </Text>
            </View>
          )}

          {/* Titre principal */}
          <Text className="text-base font-bold leading-5 text-zinc-900 dark:text-zinc-50 mb-2">
            {item.title}
          </Text>

          {/* Corps de texte */}
          <Text className="text-sm leading-5 text-zinc-600 dark:text-zinc-300 font-medium">
            {item.content}
          </Text>

          {/* Ligne discrète de séparation */}
          <View className="my-4 h-[1px] bg-zinc-100 dark:bg-zinc-800" />

          {/* PIED DE LA CARTE (Date et Partage) */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Calendar size={12} color="#A1A1AA" />
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                {format(new Date(item.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </Text>
            </View>

            {/* Bouton Partager */}
            <Pressable
              onPress={handleShare}
              className="flex-row items-center gap-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 dark:bg-zinc-800 dark:border-zinc-800 active:opacity-80"
            >
              <Share2 size={12} color="#71717A" strokeWidth={2} />
              <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Partager
              </Text>
            </Pressable>
          </View>

        </Pressable>
      </View>

      {/* OUVERTURE DE L'IMAGE EN PLEIN ÉCRAN */}
      {hasImage && (
        <ImageViewer
          visible={isPreviewOpen}
          uri={displayedImage}
          aspectRatio={imageRatio}
          onClose={() => setIsPreviewOpen(false)}
          onDownloadSuccess={() => showToast({ type: 'success', message: 'L’image a bien été enregistrée.' })}
          onDownloadError={() => showToast({ type: 'error', message: "Impossible d'enregistrer l'image." })}
        />
      )}
    </Animated.View>
  );
}
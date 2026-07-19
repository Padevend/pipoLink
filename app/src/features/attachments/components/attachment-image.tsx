import { useToast } from '@/providers';
import type { MessageAttachment } from '@/shared/api/types';
import { formatBytes } from '@/shared/lib/file';
import { ImageViewer } from '@/shared/ui/image-viewer';
import { cn } from '@/shared/utils/cn';
import { Image as ExpoImage } from 'expo-image';
import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAttachmentDownload } from '../hooks/useAttachmentDownload';
import { AttachmentProgressCircle } from './attachment-progress-circle';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const DEFAULT_ASPECT = 4 / 3;
const MAX_WIDTH = 260;

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface AttachmentImageProps {
  attachment: MessageAttachment;
  messageId: string;
  chatId: string;
  isMine: boolean;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function AttachmentImage({
  attachment,
  messageId,
  chatId,
  isMine,
}: AttachmentImageProps) {
  const {
    status,
    progress,
    decryptedUri,
    download,
    pause,
    resume,
    openFile,
  } = useAttachmentDownload({ attachment, messageId, chatId });

  const [aspectRatio, setAspectRatio] = useState<number>(DEFAULT_ASPECT);
  const [hasImage, setHasImage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const { showToast } = useToast();

  // Animation de transition technique linéaire et rapide
  const fadeIn = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeIn.value }));

  useEffect(() => {
    if (status === 'completed' && decryptedUri) {
      Image.getSize(
        decryptedUri,
        (w, h) => {
          if (w > 0 && h > 0) setAspectRatio(w / h);
        },
        () => { }, // Fallback au ratio par défaut
      );
      fadeIn.value = withTiming(1, { duration: 200, easing: Easing.linear });
    }
  }, [status, decryptedUri]);

  function handleCirclePress() {
    switch (status) {
      case 'idle':
      case 'cancelled':
      case 'failed':
        download();
        break;
      case 'downloading':
        pause();
        break;
      case 'paused':
        resume();
        break;
      case 'completed':
        openFile();
        break;
      default:
        break;
    }
  }

  return (
    <>
      <Pressable
        onPress={status === 'completed' ? openFile : undefined}
        disabled={status !== 'completed'}
        className="active:opacity-95"
      >
        <View
          className={cn(
            'rounded-xl overflow-hidden border',
            isMine
              ? 'bg-orange-600/10 border-orange-500/30'
              : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
          )}
          style={{ width: MAX_WIDTH, aspectRatio }}
        >
          {/* ── IMAGE DÉCHIFFRÉE (STATUT COMPLETED) ── */}
          {status === 'completed' && decryptedUri ? (
            <Animated.View style={[{ flex: 1 }, fadeStyle]}>
              <Pressable
                className='absolute inset-0 z-10'
                onPress={() => {
                  setHasImage(decryptedUri);
                  setIsPreviewOpen(true);
                }}
              />
              <ExpoImage
                source={{ uri: decryptedUri }}
                style={{ flex: 1 }}
                contentFit="cover"
                cachePolicy="disk"
                transition={150}
                recyclingKey={attachment.id}
              />
            </Animated.View>
          ) : (
            /* ── PLACEHOLDER ET CHARGEMENT TECHNIQUE TRUCQUÉ ── */
            <View className="flex-1 items-center justify-center p-4">
              
              {/* Fond Brut Mat Uniforme */}
              <View className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900/90" />

              {/* Indicateur Circulaire Industriel */}
              <AttachmentProgressCircle
                progress={progress}
                status={status}
                size={46}
                isMine={isMine}
                onPress={handleCirclePress}
              />

              {/* Section Métadonnées Système */}
              <View className="mt-3 px-2 py-0.5 rounded bg-zinc-200/50 dark:bg-zinc-800/60 border border-zinc-300/30 dark:border-zinc-700/30 items-center">
                {status === 'downloading' && (
                  <Text className="text-orange-500 dark:text-orange-400 font-mono text-[9px] font-black tracking-widest">
                    DL_PROGRESS // {Math.round(progress * 100)}%
                  </Text>
                )}
                {status === 'decrypting' && (
                  <Text className="text-orange-500 dark:text-orange-400 font-mono text-[9px] font-bold tracking-wider uppercase animate-pulse">
                    Déchiffrement…
                  </Text>
                )}
                {status === 'paused' && (
                  <Text className="text-zinc-500 dark:text-zinc-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                    En pause
                  </Text>
                )}
                {(status === 'idle' || status === 'cancelled') && (
                  <Text className="text-zinc-600 dark:text-zinc-400 font-mono text-[9px] font-bold tracking-tight">
                    RAW_DATA // {formatBytes(attachment.fileSize)}
                  </Text>
                )}
                {status === 'failed' && (
                  <Text className="text-red-500 dark:text-red-400 font-mono text-[9px] font-black uppercase tracking-wider">
                    ⚠️ ÉCHEC_RÉESSAYER
                  </Text>
                )}
                {status === 'queued' && (
                  <Text className="text-zinc-400 dark:text-zinc-500 font-mono text-[9px] font-bold uppercase tracking-widest">
                    FILE_ATTENTE
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </Pressable>

      {/* VISIONNEUSE PLEIN ÉCRAN */}
      {hasImage && (
        <ImageViewer
          visible={isPreviewOpen}
          uri={hasImage}
          aspectRatio={aspectRatio}
          onClose={() => setIsPreviewOpen(false)}
          onDownloadSuccess={() => showToast({ type: 'success', message: 'Fichier synchronisé ✓' })}
          onDownloadError={() => showToast({ type: 'error', message: "Erreur de stockage local" })}
        />
      )}
    </>
  );
}
/**
 * attachment-image.tsx
 *
 * Image attachment component with full WhatsApp-inspired lazy-loading UI.
 *
 * Visual states:
 *   1. Idle (not downloaded yet)
 *      - Blurred grey placeholder at the correct aspect ratio
 *      - Translucent dark overlay
 *      - Download button (AttachmentProgressCircle in idle state)
 *      - File size shown in corner
 *
 *   2. Downloading
 *      - Same blurred placeholder
 *      - Animated circular progress arc replacing the download button
 *      - Tapping the circle PAUSES the download
 *      - Progress percentage shown below the circle
 *
 *   3. Paused
 *      - Progress ring frozen at current position
 *      - Play icon inside ring — tap to resume
 *
 *   4. Decrypting
 *      - Spinning indeterminate ring with lock icon
 *      - "Déchiffrement…" label
 *
 *   5. Completed
 *      - Full-resolution image rendered from `decryptedUri`
 *      - Aspect ratio preserved (read from Image.getSize)
 *      - Fade-in animation
 *      - Tap to open full-screen (via OS viewer or navigation)
 *
 *   6. Failed
 *      - Placeholder with red tint
 *      - Retry button (RotateCcw icon) — tapping retries the download
 *      - Error message shown
 */

import type { MessageAttachment } from '@/shared/api/types';
import { formatBytes } from '@/shared/lib/file';
import { cn } from '@/shared/utils/cn';
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

  // Actual image aspect ratio (resolved once the image loads)
  const [aspectRatio, setAspectRatio] = useState<number>(DEFAULT_ASPECT);

  // Fade-in animation for when the decrypted image loads
  const fadeIn = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeIn.value }));

  // Resolve image dimensions once the file is decrypted
  useEffect(() => {
    if (status === 'completed' && decryptedUri) {
      Image.getSize(
        decryptedUri,
        (w, h) => {
          if (w > 0 && h > 0) setAspectRatio(w / h);
        },
        () => {}, // Ignore size errors — keep default
      );
      // Fade the image in
      fadeIn.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    }
  }, [status, decryptedUri]);

  // ── Action handler: what the circle tap does per status ──────────────────
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

  // ── Rendered image or placeholder ─────────────────────────────────────────
  return (
    <Pressable
      onPress={status === 'completed' ? openFile : undefined}
      disabled={status !== 'completed'}
    >
      <View
        className={cn(
          'rounded-xl overflow-hidden bg-black/10 dark:bg-black/30',
          'border border-black/5 dark:border-white/5',
        )}
        style={{ width: MAX_WIDTH, aspectRatio }}
      >
        {/* ── Decrypted image (only when completed) ── */}
        {status === 'completed' && decryptedUri ? (
          <Animated.View style={[{ flex: 1 }, fadeStyle]}>
            <Image
              source={{ uri: decryptedUri }}
              style={{ flex: 1 }}
              resizeMode="cover"
            />
          </Animated.View>
        ) : (
          /* ── Placeholder overlay (shown for all non-completed states) ── */
          <View className="flex-1 items-center justify-center">

            {/* Blurred grey background */}
            <View
              className="absolute inset-0 bg-neutral-300 dark:bg-neutral-700 opacity-60"
            />

            {/* Dark tint overlay */}
            <View className="absolute inset-0 bg-black/20" />

            {/* Circular progress + action button */}
            <AttachmentProgressCircle
              progress={progress}
              status={status}
              size={52}
              isMine={isMine}
              onPress={handleCirclePress}
            />

            {/* Status label */}
            <View className="mt-2 items-center">
              {status === 'downloading' && (
                <Text className="text-white text-[10px] font-bold opacity-90">
                  {Math.round(progress * 100)}%
                </Text>
              )}
              {status === 'decrypting' && (
                <Text className="text-white text-[10px] font-semibold opacity-80">
                  Déchiffrement…
                </Text>
              )}
              {status === 'paused' && (
                <Text className="text-white text-[10px] font-semibold opacity-70">
                  En pause
                </Text>
              )}
              {(status === 'idle' || status === 'cancelled') && (
                <Text className="text-white text-[10px] font-medium opacity-70">
                  {formatBytes(attachment.fileSize)}
                </Text>
              )}
              {status === 'failed' && (
                <Text className="text-red-300 text-[10px] font-bold">
                  Réessayer
                </Text>
              )}
              {status === 'queued' && (
                <Text className="text-white text-[10px] font-medium opacity-70">
                  En file…
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

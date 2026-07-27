import { cn } from '@/shared/utils/cn';
import { Copy, Pencil, RefreshCw, Reply, RotateCw, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown
} from "react-native-reanimated";

interface BubbleMenuProps {
  isMine: boolean;
  isFailed?: boolean;
  onReply?: () => void;
  onCopy?: () => void;
  onResend?: () => void;
  onEdit?: () => void;
  onRetry?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function BubbleMenu({
  isMine,
  isFailed,
  onReply,
  onCopy,
  onResend,
  onEdit,
  onRetry,
  onDelete,
  onClose,
}: BubbleMenuProps) {
  const itemsCount = isFailed
    ? (onRetry ? 1 : 0) + (onDelete ? 1 : 0)
    : (onReply ? 1 : 0) + (onResend ? 1 : 0) + (onEdit ? 1 : 0) + (onCopy ? 1 : 0) + (onDelete ? 1 : 0);
  const topOffset = -(itemsCount * 36 + 14);

  return (
    <>
      {/* Zone d'interception globale pour fermer le menu au clic extérieur */}
      <Pressable
        onPress={onClose}
        className="absolute z-100 bg-transparent"
        style={{ width: 4000, height: 4000, left: -2000, top: -2000 }}
      />

      {/* Conteneur Dropdown Vertical Sophistiqué */}
      <Animated.View
        entering={FadeInDown.duration(180).springify().mass(0.6)}
        exiting={FadeOutDown.duration(100)}
        style={{ top: topOffset }}
        className={cn(
          'absolute z-50 min-w-[145px] flex-col p-1.5 rounded-xl backdrop-blur-xl',
          'bg-surface-light/95 dark:bg-surface-dark/95',
          'border border-border-light/30 dark:border-border-dark/10',
          'shadow-2xl shadow-black/10 dark:shadow-black/30',
          isMine ? 'right-1' : 'left-1'
        )}
      >
        {isFailed ? (
          <>
            {/* ACTION : RÉESSAYER */}
            {onRetry && (
              <Pressable
                onPress={() => { onRetry(); onClose(); }}
                className="flex-row items-center justify-between px-3 py-2 rounded-lg active:bg-orange-500/10 transition-colors"
              >
                <Text className="text-[12px] font-bold tracking-tight text-orange-500">
                  Réessayer
                </Text>
                <RefreshCw size={14} color="#FF6B00" strokeWidth={2.5} />
              </Pressable>
            )}

            {onRetry && onDelete && (
              <View className="h-[0.5px] my-1 mx-1 bg-border-light/40 dark:bg-border-dark/10" />
            )}

            {/* ACTION : SUPPRIMER */}
            {onDelete && (
              <Pressable
                onPress={() => { onDelete(); onClose(); }}
                className="flex-row items-center justify-between px-3 py-2 rounded-lg active:bg-red-500/10 transition-colors"
              >
                <Text className="text-[12px] font-bold tracking-tight text-red-500 dark:text-red-400">
                  Supprimer
                </Text>
                <Trash2 size={14} color="red" strokeWidth={2.5} />
              </Pressable>
            )}
          </>
        ) : (
          <>
            {/* ACTION : RENVOYER */}
            {onResend && (
              <Pressable
                onPress={() => { onResend(); onClose(); }}
                className="flex-row items-center justify-between px-3 py-2 rounded-lg active:bg-neutral-100 dark:active:bg-neutral-800/60 transition-colors"
              >
                <Text className="text-[12px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                  Renvoyer
                </Text>
                <RotateCw size={14} color="#FF6B00" strokeWidth={2.5} />
              </Pressable>
            )}

            {/* ACTION : MODIFIER */}
            {onEdit && (
              <Pressable
                onPress={() => { onEdit(); onClose(); }}
                className="flex-row items-center justify-between px-3 py-2 rounded-lg active:bg-neutral-100 dark:active:bg-neutral-800/60 transition-colors"
              >
                <Text className="text-[12px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                  Modifier
                </Text>
                <Pencil size={14} color="#64748B" strokeWidth={2.5} />
              </Pressable>
            )}

            {/* ACTION : RÉPONDRE */}
            {onReply && (
              <Pressable
                onPress={() => { onReply(); onClose(); }}
                className="flex-row items-center justify-between px-3 py-2 rounded-lg active:bg-neutral-100 dark:active:bg-neutral-800/60 transition-colors"
              >
                <Text className="text-[12px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                  Répondre
                </Text>
                <Reply size={14} color="#64748B" strokeWidth={2.5} />
              </Pressable>
            )}

            {/* ACTION : COPIER */}
            {onCopy && (
              <Pressable
                onPress={() => { onCopy(); onClose(); }}
                className="flex-row items-center justify-between px-3 py-2 rounded-lg active:bg-neutral-100 dark:active:bg-neutral-800/60 transition-colors"
              >
                <Text className="text-[12px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                  Copier
                </Text>
                <Copy size={14} color="#64748B" strokeWidth={2.5} />
              </Pressable>
            )}

            {/* ACTION : SUPPRIMER */}
            {onDelete && (
              <>
                {(onReply || onResend || onEdit || onCopy) && (
                  <View className="h-[0.5px] my-1 mx-1 bg-border-light/40 dark:bg-border-dark/10" />
                )}
                <Pressable
                  onPress={() => { onDelete(); onClose(); }}
                  className="flex-row items-center justify-between px-3 py-2 rounded-lg active:bg-red-500/10 transition-colors"
                >
                  <Text className="text-[12px] font-bold tracking-tight text-red-500 dark:text-red-400">
                    Supprimer
                  </Text>
                  <Trash2 size={14} color="red" strokeWidth={2.5} />
                </Pressable>
              </>
            )}
          </>
        )}
      </Animated.View>
    </>
  );
}
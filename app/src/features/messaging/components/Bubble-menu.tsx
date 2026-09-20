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
  const topOffset = -(itemsCount * 44 + 16);

  return (
    <>
      {/* Zone d'interception globale pour fermer le menu au clic extérieur */}
      <Pressable
        onPress={onClose}
        className="absolute z-50 bg-transparent"
        style={{ width: 4000, height: 4000, left: -2000, top: -2000 }}
      />

      {/* Conteneur Dropdown Vertical (rounded-2xl, fond plein, sans ombre) */}
      <Animated.View
        entering={FadeInDown.duration(180).springify().mass(0.6)}
        exiting={FadeOutDown.duration(100)}
        style={{ top: topOffset }}
        className={cn(
          'absolute z-50 min-w-[170px] flex-col p-2 rounded-2xl',
          'bg-white dark:bg-[#1A1A1A]',
          'border-2 border-zinc-100 dark:border-[#222222]',
          isMine ? 'right-0' : 'left-0'
        )}
      >
        {isFailed ? (
          <>
            {/* ACTION : RÉESSAYER */}
            {onRetry && (
              <Pressable
                onPress={() => { onRetry(); onClose(); }}
                className="flex-row items-center justify-between px-4 py-3 rounded-xl active:opacity-80"
              >
                <Text className="text-xs font-black uppercase tracking-widest text-orange-500">
                  Réessayer
                </Text>
                <RefreshCw size={16} color="#F97316" strokeWidth={2.5} />
              </Pressable>
            )}

            {onRetry && onDelete && (
              <View className="h-[2px] w-full my-1 bg-zinc-100 dark:bg-[#222222]" />
            )}

            {/* ACTION : SUPPRIMER */}
            {onDelete && (
              <Pressable
                onPress={() => { onDelete(); onClose(); }}
                className="flex-row items-center justify-between px-4 py-3 rounded-xl active:opacity-80"
              >
                <Text className="text-xs font-black uppercase tracking-widest text-red-500">
                  Supprimer
                </Text>
                <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
              </Pressable>
            )}
          </>
        ) : (
          <>
            {/* ACTION : RENVOYER */}
            {onResend && (
              <Pressable
                onPress={() => { onResend(); onClose(); }}
                className="flex-row items-center justify-between px-4 py-3 rounded-xl active:opacity-80"
              >
                <Text className="text-xs font-bold text-zinc-950 dark:text-white">
                  Renvoyer
                </Text>
                <RotateCw size={16} color="#F97316" strokeWidth={2.5} />
              </Pressable>
            )}

            {/* ACTION : MODIFIER */}
            {onEdit && (
              <Pressable
                onPress={() => { onEdit(); onClose(); }}
                className="flex-row items-center justify-between px-4 py-3 rounded-xl active:opacity-80"
              >
                <Text className="text-xs font-bold text-zinc-950 dark:text-white">
                  Modifier
                </Text>
                <Pencil size={16} color="#A1A1AA" strokeWidth={2.5} />
              </Pressable>
            )}

            {/* ACTION : RÉPONDRE */}
            {onReply && (
              <Pressable
                onPress={() => { onReply(); onClose(); }}
                className="flex-row items-center justify-between px-4 py-3 rounded-xl active:opacity-80"
              >
                <Text className="text-xs font-bold text-zinc-950 dark:text-white">
                  Répondre
                </Text>
                <Reply size={16} color="#A1A1AA" strokeWidth={2.5} />
              </Pressable>
            )}

            {/* ACTION : COPIER */}
            {onCopy && (
              <Pressable
                onPress={() => { onCopy(); onClose(); }}
                className="flex-row items-center justify-between px-4 py-3 rounded-xl active:opacity-80"
              >
                <Text className="text-xs font-bold text-zinc-950 dark:text-white">
                  Copier
                </Text>
                <Copy size={16} color="#A1A1AA" strokeWidth={2.5} />
              </Pressable>
            )}

            {/* ACTION : SUPPRIMER */}
            {onDelete && (
              <>
                {(onReply || onResend || onEdit || onCopy) && (
                  <View className="h-[2px] w-full my-1 bg-zinc-100 dark:bg-[#222222]" />
                )}
                <Pressable
                  onPress={() => { onDelete(); onClose(); }}
                  className="flex-row items-center justify-between px-4 py-3 rounded-xl active:opacity-80"
                >
                  <Text className="text-xs font-black uppercase tracking-widest text-red-500">
                    Supprimer
                  </Text>
                  <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
                </Pressable>
              </>
            )}
          </>
        )}
      </Animated.View>
    </>
  );
}
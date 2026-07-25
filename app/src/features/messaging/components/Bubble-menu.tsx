import { cn } from '@/shared/utils/cn';
import { RefreshCw, Reply, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown
} from "react-native-reanimated";

interface BubbleMenuProps {
  isMine: boolean;
  isFailed?: boolean;
  onReply?: () => void;
  onRetry?: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function BubbleMenu({ isMine, isFailed, onReply, onRetry, onDelete, onClose }: BubbleMenuProps) {
  return (
    <>
      {/* Zone d'interception globale pour fermer le menu au clic extérieur */}
      <Pressable
        onPress={onClose}
        className="absolute z-40 bg-transparent"
        style={{ width: 4000, height: 4000, left: -2000, top: -2000 }}
      />

      {/* Conteneur Dropdown Vertical Sophistiqué */}
      <Animated.View
        entering={FadeInDown.duration(180).springify().mass(0.6)}
        exiting={FadeOutDown.duration(100)}
        className={cn(
          'absolute z-50 min-w-[140px] flex-col p-1.5 rounded-xl backdrop-blur-xl',
          'bg-surface-light/95 dark:bg-surface-dark/95',
          'border border-border-light/30 dark:border-border-dark/10',
          'shadow-2xl shadow-black/10 dark:shadow-black/30',
          isMine ? 'top-[-88px]' : 'top-[-45px]',
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

            {/* SÉPARATEUR HORIZONTAL FIN */}
            <View className="h-[0.5px] my-1 mx-1 bg-border-light/40 dark:bg-border-dark/10" />

            {/* ACTION : SUPPRIMER */}
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
        ) : (
          <>
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

            {/* ACTION : SUPPRIMER */}
            {isMine && (
              <>
                {/* SÉPARATEUR HORIZONTAL FIN (Style iOS/Satiné) */}
                <View className="h-[0.5px] my-1 mx-1 bg-border-light/40 dark:bg-border-dark/10" />
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
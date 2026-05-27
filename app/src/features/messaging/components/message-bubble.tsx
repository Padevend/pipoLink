import { AttachmentDocument } from "@/features/attachments/components/attachment-document";
import { AttachmentImage } from "@/features/attachments/components/attachment-image";
import { MessageAttachment } from "@/shared/api/types";
import { cn } from '@/shared/utils/cn';
import { format } from "date-fns";
import { Check, CheckCheck, Reply, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { DecryptedMessage } from "../hooks/use-messages";

// ─── COMPOSANT : MENU CONTEXTUEL (SATINÉ ET SUBTILE) ──────────────────────────

interface BubbleMenuProps {
  isMine: boolean;
  onReply: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function BubbleMenu({ isMine, onReply, onDelete, onClose }: BubbleMenuProps) {
  return (
    <>
      {/* Overlay plein écran pour intercepter la fermeture sans décaler la grille */}
      <Pressable 
        onPress={onClose} 
        className="absolute inset-0 z-40 bg-transparent"
        style={{ width: 4000, height: 4000, left: -2000, top: -2000 }}
      />

      <Animated.View
        entering={FadeIn.duration(140).springify().mass(0.8)}
        exiting={FadeOut.duration(90)}
        className={cn(
          'absolute z-50 top-[-46px] flex-row items-center p-1 rounded-xl border backdrop-blur-xl',
          'bg-white/95 dark:bg-zinc-900/95 shadow-2xl shadow-black/10',
          'border-neutral-200/50 dark:border-neutral-800/60',
          isMine ? 'right-0' : 'left-0'
        )}
      >
        {/* Option : Répondre */}
        <Pressable
          onPress={() => { onReply(); onClose(); }}
          className="flex-row items-center gap-x-1.5 px-3 py-1.5 rounded-lg active:bg-neutral-100 dark:active:bg-neutral-800"
        >
          <Reply size={13} className="text-indigo-500 dark:text-indigo-400" strokeWidth={2.5} />
          <Text className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400">
            Répondre
          </Text>
        </Pressable>

        {/* Micro-séparateur */}
        <View className="w-[0.5px] h-4 bg-neutral-200 dark:bg-neutral-800" />

        {/* Option : Supprimer */}
        <Pressable
          onPress={() => { onDelete(); onClose(); }}
          className="flex-row items-center gap-x-1.5 px-3 py-1.5 rounded-lg active:bg-red-500/10"
        >
          <Trash2 size={13} className="text-red-500" strokeWidth={2.5} />
          <Text className="text-[12px] font-bold text-red-500">
            Supprimer
          </Text>
        </Pressable>
      </Animated.View>
    </>
  );
}

// ─── COMPOSANT PRINCIPAL : BULLE DE MESSAGE ──────────────────────────────────

interface MessageBubbleProps {
  message: DecryptedMessage;
  isMine: boolean;
  hasAttachments: boolean;
  onReply?: (message: DecryptedMessage) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({
  message,
  isMine,
  hasAttachments,
  onReply,
  onDelete,
}: MessageBubbleProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const hasText = !!message.decryptedContent || !hasAttachments;

  // Animation élastique premium lors de l'interaction longue
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLongPress = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    });
    setMenuVisible(true);
  }, []);

  const renderStatusIcon = () => {
    if (!isMine) return null;
    if (message.status === 'read') {
      return <CheckCheck size={11} strokeWidth={2.5} className="text-indigo-500 dark:text-indigo-400" />;
    }
    return <Check size={11} strokeWidth={2} className="text-text-secondary-light/30 dark:text-text-secondary-dark/40" />;
  };

  const isSingleImageOnly =
    hasAttachments &&
    message.attachments?.length === 1 &&
    message.attachments[0].mimeType.startsWith('image/') &&
    !message.decryptedContent;

  return (
    <View className={cn('mb-1.5 w-full flex-row', isMine ? 'justify-end pl-12' : 'justify-start pr-12')}>
      <View className={cn('max-w-[85%] items-start relative z-10', isMine ? 'items-end' : 'items-start')}>
        
        {/* Menu Contextuel Flottant */}
        {menuVisible && (
          <BubbleMenu
            isMine={isMine}
            onReply={() => onReply?.(message)}
            onDelete={() => onDelete?.(message.id)}
            onClose={() => setMenuVisible(false)}
          />
        )}

        {/* Structure de la Bulle */}
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={240} // Vitesse réactive de l'écosystème iOS/Android moderne
          onPress={() => menuVisible && setMenuVisible(false)}
          className="active:opacity-95"
        >
          <Animated.View style={animStyle}>
            <View
              className={cn(
                'rounded-2xl px-3.5 py-2.5',
                isMine
                  ? 'rounded-br-sm bg-primary'
                  : 'rounded-bl-sm border border-border-light/30 bg-surface-light dark:border-border-dark/10 dark:bg-surface-dark/40 faceblur',
                isSingleImageOnly && 'bg-transparent border-0 dark:bg-transparent p-0'
              )}
            >
              {/* Pièces Jointes / Attachements */}
              {hasAttachments && message.attachments && (
                <View className={cn('w-full gap-y-1.5', hasText && 'mb-2')}>
                  {message.attachments.map((att: MessageAttachment) => {
                    const Component = att.mimeType.startsWith('image/') ? AttachmentImage : AttachmentDocument;
                    return (
                      <Component
                        key={att.id}
                        attachment={att}
                        messageId={message.id}
                        chatId={message.chat_id}
                        isMine={isMine}
                      />
                    );
                  })}
                </View>
              )}

              {/* Contenu textuel */}
              {hasText && (
                <Text
                  className={cn(
                    'text-[14px] leading-[20px] tracking-tight',
                    isMine ? 'text-white font-normal' : 'text-text-primary-light dark:text-text-primary-dark',
                    message.decryptFailed && 'text-[12.5px] italic text-red-500/80 dark:text-red-400/80 font-medium'
                  )}
                >
                  {message.decryptFailed
                    ? 'Message chiffré corrompu ou clé introuvable'
                    : message.decryptedContent ?? message.cipherText}
                </Text>
              )}
            </View>
          </Animated.View>
        </Pressable>

        {/* Section Métadonnées et Validation de lecture */}
        <View className="mt-1 flex-row items-center gap-x-1 px-1">
          <Text className="text-[9px] font-bold uppercase tracking-widest text-text-secondary-light/30 dark:text-text-secondary-dark/40">
            {format(new Date(message.created_at), 'HH:mm')}
          </Text>
          {renderStatusIcon()}
        </View>

      </View>
    </View>
  );
}
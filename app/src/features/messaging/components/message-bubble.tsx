import { AttachmentDocument } from "@/features/attachments/components/attachment-document";
import { AttachmentImage } from "@/features/attachments/components/attachment-image";
import { MessageAttachment } from "@/shared/api/types";
import { BRAND } from "@/shared/config/brand";
import { Avatar } from "@/shared/ui/avatar";
import { cn } from '@/shared/utils/cn';
import { format } from "date-fns";
import { Check, CheckCheck, Clock } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { DecryptedMessage } from "../hooks/use-messages";
import BubbleMenu from "./Bubble-menu";

// ─── COMPOSANT : MENU CONTEXTUEL (SATINÉ ET SUBTILE) ──────────────────────────



// ─── COMPOSANT PRINCIPAL : BULLE DE MESSAGE ──────────────────────────────────

interface MessageBubbleProps {
  isGroup?: boolean;
  message: DecryptedMessage;
  isMine: boolean;
  hasAttachments: boolean;
  onReply?: (message: DecryptedMessage) => void;
  onDelete?: (messageId: string) => void;
  onPressReplyQuote?: (messageId: string) => void;
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isMine,
  hasAttachments,
  onReply,
  onDelete,
  onPressReplyQuote,
  isGroup,
}: MessageBubbleProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const hasText = !!message.decryptedContent || !hasAttachments;

  const getReplyPreview = (rep: DecryptedMessage) => {
    if (rep.is_deleted) return 'Ce message a été supprimé';
    if (rep.decryptedContent) return rep.decryptedContent;
    if (rep.attachments && rep.attachments.length > 0) {
      if (rep.attachments[0].mimeType.startsWith('image/')) return '📷 Photo';
      return 'Document';
    }
    return 'Message';
  };

  // Animation élastique premium lors de l'interaction longue
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLongPress = useCallback(() => {
    if (message.is_deleted) return;
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    });
    setMenuVisible(true);
  }, [message.is_deleted]);

  const renderStatusIcon = () => {
    if (!isMine) return null;
    if (message.id.startsWith('temp-')) {
      return <Clock size={11} strokeWidth={2.5} color="#64748B" />;
    }
    if (message.status === 'read') {
      return <CheckCheck size={11} strokeWidth={2.5} color={BRAND.secondary} />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck size={11} strokeWidth={2.5} color={BRAND.secondary} />;
    }

    return <Check size={11} strokeWidth={2.5} color="#64748B" />;
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
          delayLongPress={240}
          onPress={() => menuVisible && setMenuVisible(false)}
          className="active:opacity-95 flex-row items-end"
        >
          {isGroup && !isMine && (
            <Pressable onPress={() => { }} className="rounded-full mx-2">
              <Avatar
                name={message.sender?.username || 'Inconnu'}
                uri={message.sender?.profile?.avatarUrl ?? undefined}
                size="md"
              />
            </Pressable>
          )}
          <Animated.View style={animStyle} className="flex flex-col">
            <View
              className={cn(
                'rounded-2xl px-3.5 py-2.5',
                isMine
                  ? `rounded-br-sm ${message.is_deleted ? 'bg-primary/20' : 'bg-primary'}`
                  : 'rounded-bl-sm border border-border-light/30 bg-surface-light dark:border-border-dark/10 dark:bg-surface-dark/40 faceblur',
                isSingleImageOnly && 'bg-transparent border-0 dark:bg-transparent p-0',

              )}
            >
              {message.is_deleted ? (
                <Text className={cn("text-[12px] italic", isMine ? "text-white" : "text-text-secondary-light dark:text-text-secondary-dark")}>
                  Ce message a été supprimé
                </Text>
              ) : (
                <>
                  {/* Référence de la réponse (Blockquote) */}
                  {message.responseToDecrypted && (
                    <Pressable
                      onPress={() => {
                        if (message.responseToId && onPressReplyQuote) {
                          onPressReplyQuote(message.responseToId);
                        }
                      }}
                      className={cn(
                        'mb-2 border-l-2 pl-2 rounded-sm',
                        isMine ? 'border-white/50 bg-white/10' : 'border-primary/50 bg-primary/5',
                        'py-1 px-2'
                      )}
                    >
                      <Text className={cn("text-[11px] font-bold mb-0.5", isMine ? "text-white/80" : "text-primary")}>
                        {message.responseToDecrypted.sender?.username || 'Utilisateur'}
                      </Text>
                      <Text
                        className={cn("text-[12px]", isMine ? "text-white/90" : "text-text-primary-light dark:text-text-primary-dark")}
                        numberOfLines={2}
                      >
                        {getReplyPreview(message.responseToDecrypted)}
                      </Text>
                    </Pressable>
                  )}

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
                </>
              )}
            </View>
            {isGroup && !isMine && message.sender?.username && (
              <Text className="text-sm text-text-primary-light/40 dark:text-text-primary-dark/40 mt-0.5 ml-1">
                @{message.sender.username}
              </Text>
            )}
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
}, (prev, next) => {
  return prev.message.id === next.message.id &&
         prev.message.status === next.message.status &&
         prev.message.is_deleted === next.message.is_deleted &&
         prev.message.cipherText === next.message.cipherText &&
         prev.isMine === next.isMine &&
         prev.isGroup === next.isGroup;
});
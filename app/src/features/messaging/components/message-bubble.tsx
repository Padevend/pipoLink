import { AttachmentDocument } from "@/features/attachments/components/attachment-document";
import { AttachmentImage } from "@/features/attachments/components/attachment-image";
import { MessageAttachment } from "@/shared/api/types";
import { Avatar } from "@/shared/ui/avatar";
import { LinkifiedText } from "@/shared/ui/linkified-text";
import { cn } from '@/shared/utils/cn';
import { format } from "date-fns";
import { AlertCircle, Check, CheckCheck, Clock } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { DecryptedMessage } from "../hooks/use-messages";
import BubbleMenu from "./Bubble-menu";
import * as WebBrowser from 'expo-web-browser';
import { APP_CONFIG } from "@/shared/config/app";

interface MessageBubbleProps {
  isGroup?: boolean;
  message: DecryptedMessage;
  isMine: boolean;
  hasAttachments: boolean;
  onReply?: (message: DecryptedMessage) => void;
  onRetry?: (message: DecryptedMessage) => void;
  onDelete?: (messageId: string) => void;
  onDeleteLocal?: (messageId: string) => void;
  onPressReplyQuote?: (messageId: string) => void;
}

const ORANGE_PRINCIPAL = '#FF6B00';
const GRIS_VALIDATION = '#A1A1AA';

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isMine,
  hasAttachments,
  onReply,
  onRetry,
  onDelete,
  onDeleteLocal,
  onPressReplyQuote,
  isGroup,
}: MessageBubbleProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const hasText = !!message.decryptedContent || !hasAttachments;
  const isFailed = message.status === 'fail';

  const getReplyPreview = (rep: DecryptedMessage) => {
    if (rep.is_deleted) return 'Ce message a été supprimé';
    if (rep.decryptedContent) return rep.decryptedContent;
    if (rep.attachments && rep.attachments.length > 0) {
      if (rep.attachments[0].mimeType.startsWith('image/')) return '📷 Photo';
      return 'Document';
    }
    return 'Message';
  };

  // Animation de pression rigoureuse
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLongPress = useCallback(() => {
    if (message.is_deleted) return;
    scale.value = withSpring(0.98, { damping: 25, stiffness: 350 }, () => {
      scale.value = withSpring(1, { damping: 25, stiffness: 350 });
    });
    setMenuVisible(true);
  }, [message.is_deleted]);

  const renderStatusIcon = () => {
    if (!isMine) return null;
    if (isFailed) {
      return <AlertCircle size={12} strokeWidth={2.5} color="#EF4444" />;
    }
    if (message.id.startsWith('temp-')) {
      return <Clock size={11} strokeWidth={2.5} color={GRIS_VALIDATION} />;
    }
    if (message.status === 'read' || message.status === 'delivered') {
      return <CheckCheck size={11} strokeWidth={2.5} color={isMine ? '#FFFFFF' : ORANGE_PRINCIPAL} />;
    }

    return <Check size={11} strokeWidth={2.5} color={GRIS_VALIDATION} />;
  };

  const openDocs = useCallback(() => {
    WebBrowser.openBrowserAsync(APP_CONFIG.links.message_decryption_docs).catch(()=>{});
  }, []);

  const isSingleImageOnly =
    hasAttachments &&
    message.attachments?.length === 1 &&
    message.attachments[0].mimeType.startsWith('image/') &&
    !message.decryptedContent;

  return (
    <View className={cn('mb-2 w-full flex-row', isMine ? 'justify-end pl-10' : 'justify-start pr-10')}>
      <View className={cn('max-w-[85%] items-start relative z-10', isMine ? 'items-end' : 'items-start')}>

        {/* Menu flottant technique */}
        {!message.decryptFailed && (
          <>
            {menuVisible && (
              <BubbleMenu
                isMine={isMine}
                isFailed={isFailed}
                onReply={() => onReply?.(message)}
                onRetry={() => onRetry?.(message)}
                onDelete={() => {
                  if (isFailed) {
                    onDeleteLocal ? onDeleteLocal(message.id) : onDelete?.(message.id);
                  } else {
                    onDelete?.(message.id);
                  }
                }}
                onClose={() => setMenuVisible(false)}
              />
            )}
          </>
        )}

        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={240}
          onPress={() => menuVisible && setMenuVisible(false)}
          className="active:opacity-95 flex-row items-end"
        >
          {isGroup && !isMine && (
            <View className="rounded-xl border border-zinc-100 dark:border-zinc-900 overflow-hidden mr-2 mb-1">
              <Avatar
                name={message.sender?.username || 'Inconnu'}
                uri={message.sender?.profile?.avatarUrl ?? undefined}
                size="sm"
              />
            </View>
          )}

          <Animated.View style={animStyle} className="flex flex-col">
            <View
              className={cn(
                'rounded-xl px-3.5 py-2.5 border',
                isMine
                  ? message.is_deleted
                    ? 'bg-zinc-100 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'
                    : message.decryptFailed
                      ? 'bg-orange-50 dark:bg-orange-100 border-0'
                      : 'bg-orange-500 border-orange-600 dark:bg-orange-600 dark:border-orange-700'
                  : 'border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/40',
                isSingleImageOnly && 'bg-transparent border-0 dark:bg-transparent p-0'
              )}
            >
              {message.is_deleted ? (
                <Text className={cn("text-xs italic font-medium", isMine ? "text-zinc-400" : "text-zinc-400 dark:text-zinc-500")}>
                  Ce message a été supprimé
                </Text>
              ) : message.decryptFailed ? (
                <View className="text-xs">
                  <Text className={cn("text-xs font-medium italic", isMine ? "text-zinc-400" : "text-zinc-400 dark:text-zinc-500")}>Ce message n'a pas pu être déchiffré</Text>
                  <Pressable
                    onPress={openDocs}
                  >
                    <Text className="text-xs underline text-orange-500 italic">Decouvrir pourquoi ici</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  {/* Bloc de Citation (Réponse) technique */}
                  {message.responseToDecrypted && (
                    <Pressable
                      onPress={() => {
                        if (message.responseToId && onPressReplyQuote) {
                          onPressReplyQuote(message.responseToId);
                        }
                      }}
                      className={cn(
                        'mb-2 border-l-2 pl-2 rounded-md py-1 px-2',
                        isMine
                          ? 'border-white/40 bg-white/10'
                          : 'border-orange-500/40 bg-orange-500/5'
                      )}
                    >
                      <Text className={cn("font-mono text-[9px] font-bold uppercase tracking-wider mb-0.5", isMine ? "text-white/80" : "text-orange-500")}>
                        @{message.responseToDecrypted.sender?.username || 'Utilisateur'}
                      </Text>
                      <Text
                        className={cn("text-[11px] font-medium", isMine ? "text-white/90" : "text-zinc-600 dark:text-zinc-400")}
                        numberOfLines={1}
                      >
                        {getReplyPreview(message.responseToDecrypted)}
                      </Text>
                    </Pressable>
                  )}

                  {/* Pièces Jointes */}
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

                  {/* Corps du Texte — liens détectés automatiquement et cliquables */}
                  {hasText && (
                    <LinkifiedText
                      className={cn(
                        'text-xs leading-relaxed font-medium tracking-tight',
                        isMine ? 'text-white' : 'text-zinc-900 dark:text-zinc-50',
                        message.decryptFailed && 'font-mono text-[11px] text-red-500 dark:text-red-400 font-bold'
                      )}
                      linkClassName={isMine ? 'text-white underline font-bold' : undefined}
                    >
                      {message.decryptedContent ?? message.cipherText}
                    </LinkifiedText>
                  )}
                </>
              )}
            </View>

            {/* Auteur sous le message en mode groupe */}
            {isGroup && !isMine && message.sender?.username && (
              <Text className="font-mono text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-1 ml-1 tracking-wider">
                @{message.sender.username}
              </Text>
            )}
          </Animated.View>
        </Pressable>

        {/* Métadonnées temporelles et statut */}
        <View className="mt-1 flex-row items-center gap-x-1 px-1">
          <Text className="font-mono text-[9px] font-bold text-zinc-400 dark:text-zinc-500/70">
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
    prev.message.decryptedContent === next.message.decryptedContent &&
    prev.isMine === next.isMine &&
    prev.isGroup === next.isGroup;
});
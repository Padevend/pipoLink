import { AttachmentDocument } from "@/features/attachments/components/attachment-document";
import { AttachmentImage } from "@/features/attachments/components/attachment-image";
import { MessageAttachment } from "@/shared/api/types";
import { cn } from '@/shared/utils/cn';
import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react-native";
import { Text, View } from 'react-native';
import { DecryptedMessage } from "../hooks/use-messages";

// ─── COMPOSANT PRINCIPAL : BULLE DE MESSAGE ──────────────────────────────────
export function MessageBubble({ 
  message, 
  isMine, 
  hasAttachments 
}: { 
  message: DecryptedMessage; 
  isMine: boolean; 
  hasAttachments: boolean; 
}) {
  
  const hasText = !!message.decryptedContent || !hasAttachments;

  // Calcul du statut de lecture
  const renderStatusIcon = () => {
    if (!isMine) return null;
    if (message.status === 'read') {
      return <CheckCheck size={11} className="text-text-secondary-light/40 dark:text-text-secondary-dark/50" strokeWidth={2.5} />;
    }
    return <Check size={11} className="text-text-secondary-light/40 dark:text-text-secondary-dark/50" strokeWidth={2} />;
  };

  return (
    <View className={cn('mb-3 w-full flex-row', isMine ? 'justify-end pl-10' : 'justify-start pr-10')}>
      <View className={cn('max-w-[85%] items-start', isMine ? 'items-end' : 'items-start')}>
        
        {/* CORPS DE LA BULLE */}
        <View
          className={cn(
            'rounded-2xl px-3.5 py-2.5 backdrop-blur-md',
            isMine
              ? 'rounded-br-sm bg-primary'
              : 'rounded-bl-sm border border-border-light/50 bg-surface-light dark:border-border-dark dark:bg-surface-dark/40',
            // Si le message ne contient qu'une seule image et pas de texte, on enlève le fond et les paddings pour un effet "bord à bord" ultra pro
            hasAttachments && message.attachments?.length === 1 && message.attachments[0].mimeType.startsWith('image/') && !message.decryptedContent && 'p-0 border-0 bg-transparent dark:bg-transparent backdrop-blur-none'
          )}
        >
          {/* GESTION DES ATTACHEMENTS */}
          {hasAttachments && message.attachments && (
            <View className={cn('w-full gap-y-2', hasText && 'mb-2')}>
              {message.attachments.map((att: MessageAttachment) => {
                const isImage = att.mimeType.startsWith('image/');

                if (isImage) {
                  return (
                    <AttachmentImage
                      key={att.id}
                      attachment={att}
                      messageId={message.id}
                      chatId={message.chat_id}
                      isMine={isMine}
                    />
                  );
                }

                return (
                  <AttachmentDocument
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

          {/* TEXTE DU MESSAGE */}
          {hasText && (
            <Text
              className={cn(
                'text-[14px] leading-[20px] tracking-tight',
                isMine ? 'text-white font-normal' : 'text-text-primary-light dark:text-text-primary-dark',
                message.decryptFailed && 'text-[12px] italic opacity-80'
              )}
            >
              {message.decryptFailed
                ? 'Message chiffré illisible — clé manquante.'
                : message.decryptedContent ?? message.cipherText}
            </Text>
          )}
        </View>

        {/* MÉTADONNÉES DU MESSAGE (SITUÉES HORS DE LA BULLE POUR LE NETTOYAGE VISUEL) */}
        <View className="flex-row items-center mt-1 px-1 gap-x-1">
          <Text className="text-[9px] font-bold uppercase tracking-wide text-text-secondary-light/30 dark:text-text-secondary-dark/40">
            {format(new Date(message.created_at), 'HH:mm')}
          </Text>
          {renderStatusIcon()}
        </View>
        
      </View>
    </View>
  );
}
import type { MessageAttachment } from '@/shared/api/types';
import { formatBytes } from '@/shared/lib/file';
import { cn } from '@/shared/utils/cn';
import { FileText } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useAttachmentDownload } from '../hooks/useAttachmentDownload';
import { AttachmentProgressCircle } from './attachment-progress-circle';

interface AttachmentDocumentProps {
  attachment: MessageAttachment;
  messageId: string;
  chatId: string;
  isMine: boolean;
}

export function AttachmentDocument({
  attachment,
  messageId,
  chatId,
  isMine,
}: AttachmentDocumentProps) {
  const {
    status,
    progress,
    download,
    pause,
    resume,
    openFile,
  } = useAttachmentDownload({ attachment, messageId, chatId });

  function handleAction() {
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

  // Helper to determine the status text below the filename
  const getSubtext = () => {
    switch (status) {
      case 'downloading':
        return `Téléchargement… ${Math.round(progress * 100)}%`;
      case 'decrypting':
        return 'Déchiffrement…';
      case 'paused':
        return 'En pause';
      case 'queued':
        return 'En file…';
      case 'failed':
        return 'Échec — Réessayer';
      case 'completed':
      default:
        return formatBytes(attachment.fileSize);
    }
  };

  return (
    <Pressable
      onPress={handleAction}
      className={cn(
        'flex-row items-center gap-x-3 rounded-xl px-3 py-2.5 border w-full max-w-[260px]',
        isMine
          ? 'bg-white/10 border-white/10'
          : 'bg-background-light/40 border-border-light/20 dark:bg-background-dark/30 dark:border-border-dark/10',
      )}
    >
      {/* Circle Icon Indicator / Progress */}
      {status === 'completed' ? (
        <View className={cn('h-8 w-8 items-center justify-center rounded-lg', isMine ? 'bg-white/15' : 'bg-primary/10')}>
          <FileText size={14} className={isMine ? 'text-white' : 'text-primary'} strokeWidth={2.5} />
        </View>
      ) : (
        <AttachmentProgressCircle
          progress={progress}
          status={status}
          size={32}
          isMine={isMine}
          onPress={handleAction}
        />
      )}

      {/* Details */}
      <View className="flex-1">
        <Text
          className={cn(
            'text-[13px] font-bold tracking-tight',
            isMine ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark',
          )}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {attachment.fileName}
        </Text>
        <Text
          className={cn(
            'text-[10px] font-medium mt-0.5',
            status === 'failed'
              ? 'text-red-400 dark:text-red-300'
              : isMine
              ? 'text-white/60'
              : 'text-text-secondary-light/40 dark:text-text-secondary-dark/40',
          )}
        >
          {getSubtext()}
        </Text>
      </View>
    </Pressable>
  );
}

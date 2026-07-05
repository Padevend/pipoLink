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

  // Libellés système normalisés en police à espacement fixe
  const getSubtext = () => {
    switch (status) {
      case 'downloading':
        return `${Math.round(progress * 100)}%`;
      case 'decrypting':
        return 'DECRYPTING_DATA…';
      case 'paused':
        return 'PAUSED';
      case 'queued':
        return 'QUEUED';
      case 'failed':
        return 'ERROR // TAP TO RETRY';
      case 'completed':
      default:
        return `${formatBytes(attachment.fileSize)}`;
    }
  };

  return (
    <Pressable
      onPress={handleAction}
      className={cn(
        'flex-row items-center gap-x-3 rounded-xl px-3 py-2.5 border w-full max-w-[260px] active:opacity-90',
        isMine
          ? 'bg-orange-600/20 border-white/20'
          : 'bg-zinc-100 border-zinc-200 dark:bg-zinc-900/60 dark:border-zinc-800',
      )}
    >
      {/* Indicateur de statut / Icône Fichier Géométrique */}
      {status === 'completed' ? (
        <View className={cn(
          'h-8 w-8 items-center justify-center rounded-lg border',
          isMine 
            ? 'bg-orange-500 border-orange-400/30' 
            : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'
        )}>
          <FileText size={14} color={isMine ? '#FFFFFF' : '#71717A'} strokeWidth={2.5} />
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

      {/* Métadonnées du document */}
      <View className="flex-1">
        <Text
          className={cn(
            'text-xs font-bold tracking-tight',
            isMine ? 'text-white' : 'text-zinc-900 dark:text-zinc-50',
          )}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {attachment.fileName}
        </Text>
        
        <Text
          className={cn(
            'font-mono text-[9px] font-bold uppercase tracking-wider mt-0.5',
            status === 'failed'
              ? 'text-red-500 dark:text-red-400'
              : isMine
              ? 'text-orange-200/70'
              : 'text-zinc-400 dark:text-zinc-500',
          )}
        >
          {getSubtext()}
        </Text>
      </View>
    </Pressable>
  );
}
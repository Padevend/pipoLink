import { Text, View } from 'react-native';

import type { MessageModel } from '@/entities/message/model';
import { formatTime } from '@/shared/lib/date';

export interface MessageBubbleProps {
  message: MessageModel;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps): JSX.Element {
  return (
    <View className={isMine ? 'self-end' : 'self-start'}>
      <View className={isMine ? 'rounded-3xl rounded-tr-md bg-orange-500 px-4 py-3' : 'rounded-3xl rounded-tl-md bg-white px-4 py-3 dark:bg-slate-900'}>
        <Text className={isMine ? 'text-white' : 'text-slate-900 dark:text-white'}>{message.content}</Text>
        <Text className={isMine ? 'mt-1 text-right text-[10px] text-orange-100' : 'mt-1 text-right text-[10px] text-slate-400'}>
          {formatTime(message.createdAt)} • {message.status}
        </Text>
      </View>
    </View>
  );
}

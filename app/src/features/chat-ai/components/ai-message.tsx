import { View } from 'react-native';

import { LinkifiedText } from '@/shared/ui/linkified-text';

export interface AIMessageProps {
  content: string;
  isUser?: boolean;
}

export function AIMessage({ content, isUser }: AIMessageProps): JSX.Element {
  return (
    <View className={isUser ? 'self-end rounded-3xl rounded-tr-md bg-orange-500 px-4 py-3' : 'self-start rounded-3xl rounded-tl-md bg-white px-4 py-3 dark:bg-slate-900'}>
      <LinkifiedText
        className={isUser ? 'text-white' : 'text-slate-900 dark:text-white'}
        linkClassName={isUser ? 'text-white underline font-bold' : undefined}
      >
        {content}
      </LinkifiedText>
    </View>
  );
}

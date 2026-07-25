import * as WebBrowser from 'expo-web-browser';
import { useMemo } from 'react';
import { Linking, Text } from 'react-native';

import { cn } from '@/shared/utils/cn';

// Détection d'URLs http(s) et www. — un seul groupe capturant pour que
// String.split intercale les liens aux index impairs.
const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,;:!?'"])/gi;

function toOpenableUrl(raw: string): string {
  return raw.startsWith('http') ? raw : `https://${raw}`;
}

function openLink(raw: string): void {
  const url = toOpenableUrl(raw);
  WebBrowser.openBrowserAsync(url).catch(() => {
    Linking.openURL(url).catch(() => {});
  });
}

interface LinkifiedTextProps {
  children: string;
  className?: string;
  /** Style des liens — défaut : orange souligné. */
  linkClassName?: string;
}

/**
 * Texte dont les liens (https://…, www.…) sont automatiquement détectés et
 * rendus cliquables (ouverture dans le navigateur in-app).
 */
export function LinkifiedText({ children, className, linkClassName }: LinkifiedTextProps) {
  const segments = useMemo(() => children.split(URL_REGEX), [children]);

  if (segments.length === 1) {
    return <Text className={className}>{children}</Text>;
  }

  return (
    <Text className={className}>
      {segments.map((segment, index) =>
        index % 2 === 1 ? (
          <Text
            key={index}
            onPress={() => openLink(segment)}
            className={cn('underline font-bold text-orange-500 dark:text-orange-400', linkClassName)}
            suppressHighlighting
          >
            {segment}
          </Text>
        ) : (
          <Text key={index}>{segment}</Text>
        ),
      )}
    </Text>
  );
}

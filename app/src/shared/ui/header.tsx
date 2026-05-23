import { Link } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export interface HeaderProps {
  title: string;
  rightActions?: ReactNode;
  subtitle?: string;
  showBack?: boolean;
  /** Par défaut : retour à l’écran parent (expo-router). */
  backHref?: string;
}

export function Header({
  title,
  subtitle,
  rightActions,
  showBack,
  backHref = '..',
}: HeaderProps): JSX.Element {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-1 flex-row items-center gap-2">
        {showBack ? (
          <Link href={backHref as never} asChild>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full">
              <ChevronLeft size={24} color="#6B7280" />
            </Pressable>
          </Link>
        ) : null}
        <View className="flex-1">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">{title}</Text>
          {subtitle ? (
            <Text className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {rightActions}
    </View>
  );
}

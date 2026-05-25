import { Skeleton } from '@/shared/ui/skeleton';
import { View } from 'react-native';

export default function SkeletonCard() {
  return (
    <View className="mb-4 rounded-xl overflow-hidden border border-border-light/40 bg-surface-light/30 dark:border-border-dark/20 dark:bg-surface-dark/20 p-4 gap-3">
      <Skeleton className="min-h-4 w-1/3 rounded-md opacity-60" />
      <Skeleton className="min-h-6 w-3/4 rounded-md" />
      <Skeleton className="min-h-4 w-full rounded-md opacity-80" />
      <Skeleton className="min-h-4 w-5/6 rounded-md opacity-80" />
    </View>
  );
}
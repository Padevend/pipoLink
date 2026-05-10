import { View } from 'react-native';

export function TypingIndicator(): JSX.Element {
  return (
    <View className="flex-row gap-2 px-4 py-3">
      <View className="h-2 w-2 rounded-full bg-slate-400" />
      <View className="h-2 w-2 rounded-full bg-slate-400" />
      <View className="h-2 w-2 rounded-full bg-slate-400" />
    </View>
  );
}

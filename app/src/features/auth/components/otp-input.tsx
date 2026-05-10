import { TextInput, View } from 'react-native';

export interface OtpInputProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function OtpInput({ value, onChangeText }: OtpInputProps): JSX.Element {
  return (
    <View className="flex-row justify-between gap-2">
      {Array.from({ length: 6 }, (_, index) => (
        <TextInput
          key={index}
          value={value[index] ?? ''}
          onChangeText={(text) => {
            const next = value.split('');
            next[index] = text.slice(-1);
            onChangeText(next.join('').slice(0, 6));
          }}
          keyboardType="number-pad"
          maxLength={1}
          className="h-12 w-12 rounded-2xl border border-slate-200 text-center text-lg font-semibold text-slate-900 dark:border-slate-700 dark:text-white"
        />
      ))}
    </View>
  );
}

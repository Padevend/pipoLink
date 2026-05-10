import { SendHorizonal } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';

export interface AIInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function AIInput({ value, onChangeText, onSend, disabled }: AIInputProps): JSX.Element {
  const canSend = !disabled && value.trim().length > 0;

  return (
    <View className="flex-row items-end gap-2 rounded-3xl bg-white p-3 dark:bg-slate-900">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Posez votre question..."
        placeholderTextColor="#94A3B8"
        className="flex-1 py-2 text-base text-slate-900 dark:text-white"
      />
      <Pressable onPress={onSend} disabled={!canSend} className="rounded-full bg-orange-500 p-3" style={{ opacity: canSend ? 1 : 0.5 }}>
        <SendHorizonal size={18} color="white" />
      </Pressable>
    </View>
  );
}

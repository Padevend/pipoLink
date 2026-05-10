import { router } from 'expo-router';
import { Paperclip, SendHorizonal } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';

export interface MessageInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function MessageInput({ value, onChangeText, onSend, disabled }: MessageInputProps): JSX.Element {
  const isDisabled = disabled || value.trim().length === 0;

  return (
    <View className="flex-row items-end gap-2 rounded-3xl bg-white p-3 dark:bg-slate-900">
      <Pressable className="p-2" accessibilityLabel="Joindre un fichier" onPress={() => router.push('/modal/upload-file')}>
        <Paperclip size={20} color="#64748B" />
      </Pressable>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Écrire un message..."
        placeholderTextColor="#94A3B8"
        multiline
        className="flex-1 py-2 text-base text-slate-900 dark:text-white"
      />
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={onSend}
        className="rounded-full bg-orange-500 p-3"
        style={{ opacity: isDisabled ? 0.5 : 1 }}>
        <SendHorizonal size={18} color="white" />
      </Pressable>
    </View>
  );
}

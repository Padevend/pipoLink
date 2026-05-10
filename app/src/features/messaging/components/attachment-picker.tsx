import { Pressable, Text, View } from 'react-native';

export interface AttachmentPickerProps {
  onPickImage: () => void;
  onPickDocument: () => void;
}

export function AttachmentPicker({ onPickImage, onPickDocument }: AttachmentPickerProps): JSX.Element {
  return (
    <View className="flex-row gap-3">
      <Pressable onPress={onPickImage} className="flex-1 rounded-2xl bg-orange-100 px-4 py-4">
        <Text className="text-center font-semibold text-orange-700">Image</Text>
      </Pressable>
      <Pressable onPress={onPickDocument} className="flex-1 rounded-2xl bg-slate-100 px-4 py-4 dark:bg-slate-800">
        <Text className="text-center font-semibold text-slate-700 dark:text-slate-200">Document</Text>
      </Pressable>
    </View>
  );
}

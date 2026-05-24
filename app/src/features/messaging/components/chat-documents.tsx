import {
    Pressable,
    Text,
    View,
} from 'react-native';

import * as Linking from 'expo-linking';

import { FileText } from 'lucide-react-native';

interface Props {
  uri: string;

  filename: string;
}

export function ChatDocument({
  uri,
  filename,
}: Props) {
  function openDocument() {
    Linking.openURL(uri);
  }

  return (
    <Pressable
      onPress={openDocument}
      className="bg-neutral-800 rounded-2xl p-4 flex-row items-center gap-3"
    >
      <View className="bg-orange-500 p-3 rounded-xl">
        <FileText
          color={'white'}
          size={20}
        />
      </View>

      <Text className="text-white flex-1">
        {filename}
      </Text>
    </Pressable>
  );
}
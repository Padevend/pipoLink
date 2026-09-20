import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Camera, Trash2, Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/shared/utils/cn';
import { getStaticUri } from '../lib/static';

interface AvatarPickerProps {
  label?: string;
  uri: string | null;
  onChange: (uri: string | null) => void;
  error?: string;
}

export function AvatarPicker({ label = 'Photo de profil', uri, onChange, error }: AvatarPickerProps): JSX.Element {
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange(result.assets[0]?.uri);
    }
  };

  return (
    <View className="flex flex-col items-center">
      {label && (
        <Text className="self-center ml-1 text-[11px] font-black uppercase tracking-widest text-zinc-950 dark:text-zinc-300 mb-3">
          {label}
        </Text>
      )}

      <View className="relative h-28 w-28 items-center justify-center mb-3">
        <Pressable
          onPress={() => void pickImage()}
          className={cn(
            'h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-all',
            error 
              ? 'border-red-500' 
              : 'border-transparent',
          )}
        >
          {uri ? (
            <Image 
              source={{ uri: getStaticUri(uri) }} 
              style={{ width: '100%', height: '100%' }} 
              contentFit="cover" 
            />
          ) : (
            <View className="items-center justify-center h-full w-full">
              <Camera size={28} color="#F97316" strokeWidth={2.5} />
            </View>
          )}
        </Pressable>

        {uri ? (
          <Pressable
            onPress={() => onChange(null)}
            className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full bg-red-500 active:opacity-80 border-2 border-white dark:border-[#0A0A0A]"
          >
            <Trash2 size={16} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => void pickImage()}
            className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full bg-orange-500 active:opacity-80 border-2 border-white dark:border-[#0A0A0A]"
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={3} />
          </Pressable>
        )}
      </View>

      {error ? (
        <Text className="text-[10px] font-black uppercase tracking-wider text-red-500">{error}</Text>
      ) : (
        <Text className="text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">
          {uri ? 'Photo configurée avec succès' : 'Appuyez pour importer une image'}
        </Text>
      )}
    </View>
  );
}
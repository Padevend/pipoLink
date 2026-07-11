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
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View className="flex flex-col items-center">
      {/* Label aligné sur la charte des Inputs */}
      {label && (
        <Text className="self-center ml-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
          {label}
        </Text>
      )}

      {/* Enveloppe de l'avatar avec badge d'action superposé */}
      <View className="relative h-20 w-20 items-center justify-center mb-2.5">
        <Pressable
          onPress={() => void pickImage()}
          className={cn(
            'h-20 w-20 items-center justify-center overflow-hidden rounded-full border bg-zinc-50 dark:bg-zinc-900/40 active:bg-zinc-100 dark:active:bg-zinc-900',
            error 
              ? 'border-red-500 dark:border-red-500' 
              : 'border-zinc-200 dark:border-zinc-800',
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
              <Camera size={20} color="#F97316" />
            </View>
          )}
        </Pressable>

        {/* Badge d'action flottant contextuel (Rectangle adouci mat) */}
        {uri ? (
          <Pressable
            onPress={() => onChange(null)}
            className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-lg border border-red-200 bg-red-500 dark:border-red-600 active:bg-red-600"
          >
            <Trash2 size={11} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => void pickImage()}
            className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <Plus size={11} color="#F97316" />
          </Pressable>
        )}
      </View>

      {/* Message indicatif contextuel de bas de champ */}
      {error ? (
        <Text className="text-[11px] font-semibold text-red-600 dark:text-red-400">{error}</Text>
      ) : (
        <Text className="text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
          {uri ? 'Photo configurée avec succès' : 'Format carré recommandé'}
        </Text>
      )}
    </View>
  );
}
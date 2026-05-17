import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { BRAND } from '@/shared/config/brand';
import { cn } from '@/shared/utils/cn';

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
    <View className="mb-4 items-center gap-2">
      <Text className="self-start ml-1 text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
        {label}
      </Text>
      <Pressable
        onPress={() => void pickImage()}
        className={cn(
          'h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2',
          error ? 'border-error' : 'border-primary/30',
        )}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: 112, height: 112 }} contentFit="cover" />
        ) : (
          <View className="items-center gap-1 bg-surface-light dark:bg-surface-dark">
            <Camera size={32} color={BRAND.primary} />
            <Text className="text-[10px] font-bold text-primary">Ajouter</Text>
          </View>
        )}
      </Pressable>
      {uri ? (
        <Pressable onPress={() => onChange(null)}>
          <Text className="text-xs font-bold text-error">Supprimer la photo</Text>
        </Pressable>
      ) : (
        <Text className="text-center text-xs text-text-secondary-light dark:text-text-secondary-dark">
          Recadrez votre photo (carré)
        </Text>
      )}
      {error ? <Text className="text-xs font-medium text-error">{error}</Text> : null}
    </View>
  );
}

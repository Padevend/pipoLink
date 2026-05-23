import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Camera, Trash2, Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { BRAND } from '@/shared/config/brand';
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
    <View className="items-center w-full">
      {/* Label aligné sur la charte des Inputs */}
      {label && (
        <Text className="self-start ml-1 text-[13px] font-semibold text-text-secondary-light dark:text-text-secondary-dark mb-2">
          {label}
        </Text>
      )/* Enveloppe de l'avatar avec badge d'action superposé */}
      <View className="relative h-24 w-24 items-center justify-center mb-3">
        <Pressable
          onPress={() => void pickImage()}
          className={cn(
            'h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 bg-surface-light/40 dark:bg-surface-dark/30 transition-all active:scale-95',
            error ? 'border-red-500/50' : 'border-border-light/40 dark:border-border-dark/20',
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
              <Camera size={26} color={BRAND.primary} />
            </View>
          )}
        </Pressable>

        {/* Badge d'action flottant contextuel (Ajouter ou Supprimer) */}
        {uri ? (
          <Pressable
            onPress={() => onChange(null)}
            className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border border-red-200 active:scale-90 dark:border-red-950/40 bg-red-500"
          >
            <Trash2 size={13} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => void pickImage()}
            className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border border-border-light/40 bg-white active:scale-90 dark:border-border-dark/20 dark:bg-surface-dark"
          >
            <Plus size={14} color={BRAND.primary} />
          </Pressable>
        )}
      </View>

      {/* Message indicatif contextuel de bas de champ */}
      {error ? (
        <Text className="text-[11px] font-medium text-red-500 dark:text-red-400">{error}</Text>
      ) : (
        <Text className="text-center text-[12px] font-medium text-text-secondary-light/50 dark:text-text-secondary-dark/50">
          {uri ? 'Photo configurée avec succès' : 'Format carré recommandé'}
        </Text>
      )}
    </View>
  );
}
import { ArrowRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

export interface UpdateBannerProps {
  version: string;
  onPress: () => void;
}

export function UpdateBanner({ version, onPress }: UpdateBannerProps): JSX.Element {
  return (
    <Pressable onPress={onPress} className="mx-4 mb-4 flex-row items-center justify-between rounded-3xl bg-orange-500 px-4 py-3">
      <View>
        <Text className="text-sm text-orange-100">Mise à jour {version} disponible</Text>
      </View>
      <ArrowRight color="white" size={18} />
    </Pressable>
  );
}

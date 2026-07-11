import { OTPVerify } from '@/features/auth/components/otp-verify';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VerifyOtpScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        {/* Bouton Retour Géométrique Mat */}
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>
      </View>

      {/* Contenu Principal (Structure Mat Intégrée) */}
      <View
        className="flex-1 pt-6"
        style={{
          paddingBottom: insets.bottom + 16,
          paddingLeft: insets.left + 16,
          paddingRight: insets.right + 16
        }}
      >
        <OTPVerify />
      </View>

    </SafeAreaView>
  );
}
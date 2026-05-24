import { OTPVerify } from '@/features/auth/components/otp-verify';
import { router } from 'expo-router';
import { ArrowLeft, } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyOtpScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={20} color="#64748B" />
        </Pressable>
      </View>

      <View className="flex-1 px-6 pt-10">
        <OTPVerify />
      </View>
    </SafeAreaView>
  );
}

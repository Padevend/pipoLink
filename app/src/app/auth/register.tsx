import { RegisterForm } from '@/features/auth/components/register-form';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center px-6 py-4 gap-4">
        <Pressable 
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={20} color="#F97316" strokeWidth={2.5} />
        </Pressable>
        
        <View className="flex-1">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
            Inscription
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-1">
            Nouveau compte étudiant
          </Text>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Math.max(insets.bottom + 24, 32),
          paddingLeft: insets.left,
          paddingRight: insets.right
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-6 pb-10">
          <View className="mb-10">
            <Text className="text-4xl font-black tracking-tighter text-zinc-950 dark:text-white leading-[42px]">
              Rejoignez la{"\n"}communauté
            </Text>
            <Text className="text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400 mt-4">
              Accédez à vos cours, vos notes et vos services académiques en quelques instants.
            </Text>
          </View>

          <View className="w-full">
            <RegisterForm />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
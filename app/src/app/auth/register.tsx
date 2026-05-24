import { RegisterForm } from '@/features/auth/components/register-form';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      {/* En-tête Translucide Style Glassmorphism (Sans Shadow - Adaptatif Light/Dark) */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable 
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 dark:bg-background-dark/30 active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="text-text-primary-light dark:text-text-primary-dark" />
        </Pressable>
        
        <View className="ml-3.5 flex-1">
          <Text className="text-[16px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Inscription
          </Text>
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light/50 dark:text-text-secondary-dark/50 mt-0.5">
            Nouveau compte étudiant
          </Text>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-6 pb-10">
          
          {/* Section d'accueil textuelle épurée */}
          <View className="mb-8">
            <Text className="text-[24px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              Rejoignez votre communauté
            </Text>
            <Text className="text-[13px] font-medium leading-[20px] text-text-secondary-light/70 dark:text-text-secondary-dark/60 mt-1.5">
              Accédez à vos cours, vos notes et vos services académiques en quelques instants.
            </Text>
          </View>

          {/* Formulaire d'inscription enveloppé (Style Satiné / Glassmorphic) */}
          <View className="w-full rounded-2xl">
            <RegisterForm />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
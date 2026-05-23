import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { LoginForm } from '@/features/auth/components/login-form';
import { AppLogo } from '@/shared/ui/app-logo';

export default function LoginScreen() {
  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {/* Arrière-plan Immersif Texturé */}
      <View className="absolute inset-0 w-full h-full">
        <ImageBackground
          source={require("@/assets/images/bg_002.jpg")}
          className="w-full h-full"
          resizeMode="cover"
        >
          {/* Filtre de contraste adaptatif haut de gamme */}
          <View className="absolute inset-0 bg-neutral-950/75 dark:bg-black/85" />
        </ImageBackground>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          className="flex-1 px-6"
        >
          {/* Section Identité Visuelle Universitaire */}
          <View className="items-center mb-8 pt-8">
            <View className="mb-5 bg-white/5 border border-white/10 p-4 rounded-[28px] backdrop-blur-md">
              <AppLogo size="lg" showWordmark={false} />
            </View>
            
            <Text className="text-center text-[26px] font-bold text-white tracking-tight">
              Espace Académique
            </Text>
            
            <Text className="text-center text-[13px] font-medium leading-[20px] text-neutral-400 dark:text-neutral-500 mt-1.5 px-4">
              Connectez-vous à votre portail sécurisé pour accéder à vos cours, notes et services.
            </Text>
          </View>

          {/* Formulaire Intégré en Structure Glassmorphism (Sans Shadow) */}
          <View className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white p-6 dark:border-neutral-800/30 dark:bg-neutral-900 backdrop-blur-xl">
            
            {/* Petit en-tête interne discret */}
            <View className="mb-5 items-center">
              <Text className="text-[14px] font-bold uppercase tracking-widest text-black/80 dark:text-white/80">
                Identification
              </Text>
              <View className="h-[2px] w-6 bg-primary rounded-full mt-1.5" />
            </View>

            {/* Formulaire fonctionnel */}
            <LoginForm />
            
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
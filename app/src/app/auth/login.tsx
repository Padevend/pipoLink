import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { LoginForm } from '@/features/auth/components/login-form';
import { AppLogo } from '@/shared/ui/app-logo';
import { useEffect } from 'react';
import { useTheme } from '@/shared/hooks/use-theme';

export default function LoginScreen() {
  const {setMode} = useTheme()

  useEffect(()=>{
    setMode("dark")
  }, [])

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar style="light" />

      {/* ARRIÈRE-PLAN IMMERSIF NET */}
      <View className="absolute inset-0 w-full h-full">
        <ImageBackground
          source={require("@/assets/images/bg_002.jpg")}
          className="w-full h-full"
          resizeMode="cover"
        >
          {/* Filtre mat de contraste solide (opaque à 85% pour bloquer les bruits de l'image) */}
          <View className="absolute inset-0 bg-zinc-950/85 dark:bg-black/90" />
        </ImageBackground>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          className="flex-1 px-4"
        >
          {/* IDENTITÉ VISUELLE GÉOMÉTRIQUE */}
          <View className="items-center mb-6">
            <View className="mb-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <AppLogo size="lg" showWordmark={false} />
            </View>
            
            <Text className="text-center text-xl font-bold text-white tracking-tight">
              Espace Académique
            </Text>
            
            <Text className="text-center text-xs font-semibold leading-5 text-zinc-400 mt-2 px-4">
              Connectez-vous à votre portail sécurisé pour accéder à vos cours, notes et services.
            </Text>
          </View>

          {/* FORMULAIRE EN PANNEAU MAT (Adaptatif Light/Dark) */}
          <View className="w-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-900 dark:bg-zinc-950">
            
            {/* En-tête interne rectiligne */}
            <View className="mb-4 items-center">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Identification
              </Text>
              {/* Ligne d'accent orange plat géométrique */}
              <View className="h-[2px] w-5 bg-orange-500 mt-1.5" />
            </View>

            {/* Formulaire fonctionnel */}
            <LoginForm />
            
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
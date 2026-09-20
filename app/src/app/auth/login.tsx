import { StatusBar } from 'expo-status-bar';
import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoginForm } from '@/features/auth/components/login-form';
import { AppLogo } from '@/shared/ui/app-logo';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* IMAGE DE FOND & OVERLAYS (Ultra flat, sans blur) */}
          <View className="absolute top-0 left-0 right-0 h-[50vh]">
            <ImageBackground
              source={require("@/assets/images/bg_002.jpg")}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/60" />
            <View className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </View>

          {/* 1. SECTION HAUTE (HERO IMMERSIF ~ 45% DE L'ÉCRAN) */}
          <View 
            className="w-full min-h-[40vh] justify-between px-8 pb-10" 
            style={{ paddingTop: insets.top + 24 }}
          >
            <View className="flex-row items-center justify-between z-10">
              <AppLogo size="md" showWordmark={false} />
              
              <View className="px-4 py-1.5 rounded-full bg-orange-500">
                <Text className="text-[10px] font-black uppercase tracking-widest text-black">
                  Académique
                </Text>
              </View>
            </View>

            {/* Accroche Éditoriale */}
            <View className="z-10 mt-auto">
              {/* Couleur d'accentuation Orange */}
              <Text className="text-[11px] font-black uppercase tracking-widest text-orange-500 mb-3">
                Portail d'Apprentissage
              </Text>
              <Text className="text-5xl font-black tracking-tighter text-white">
                Connexion{"\n"}à l'espace
              </Text>
              <Text className="text-sm font-medium text-zinc-400 mt-4 max-w-[280px] leading-relaxed">
                Accédez à vos sessions de travail, vos notes actualisées et vos outils d'assistance IA.
              </Text>
            </View>
          </View>

          {/* 2. SECTION BASSE (PANNEAU DU FORMULAIRE) */}
          <View 
            className="flex-1 w-full bg-white dark:bg-[#0A0A0A] rounded-t-[48px] px-8 pt-8"
            style={{ paddingBottom: Math.max(insets.bottom + 24, 32) }}
          >
            <View className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 self-center mb-10" />

            <View className="mb-8 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                  Identification Sécurisée
                </Text>
              </View>
            </View>

            <LoginForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
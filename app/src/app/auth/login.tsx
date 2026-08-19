import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoginForm } from '@/features/auth/components/login-form';
import { AppLogo } from '@/shared/ui/app-logo';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-zinc-950">
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
          {/* Image de fond avec overlay sombre pour un rendu ultra propre */}
            <ImageBackground
              source={require("@/assets/images/bg_002.jpg")}
              className="absolute inset-0 w-full h-full min-h-[280px] h-[40vh] "
              resizeMode="cover"
            />
          {/* 1. SECTION HAUTE (HERO IMMERSIF ~ 35-40% DE L'ÉCRAN) */}
          <View className="relative w-full min-h-[280px] h-[40vh] justify-between px-6 pb-10" style={{ paddingTop: insets.top + 16 }}>
            
            {/* Superposition de dégradé sombre et flou artistique */}
            <View className="absolute inset-0 bg-zinc-950/70 backdrop-blur-md" />
            <View className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950" />

            {/* En-tête Héro */}
            <View className="flex-row items-center justify-between z-10">
              <AppLogo size="md" showWordmark={false} />
              <View className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                   Académique
                </Text>
              </View>
            </View>

            {/* Accroche Éditoriale */}
            <View className="z-10 mt-auto">
              <Text className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1.5">
                Portail d'Apprentissage
              </Text>
              <Text className="text-3xl font-black tracking-tight text-white leading-none">
                Connexion à{"\n"}l'espace
              </Text>
              <Text className="text-xs font-medium text-zinc-400 mt-2 max-w-[320px] leading-relaxed">
                Accédez à vos sessions de travail, vos notes actualisées et vos outils d'assistance IA.
              </Text>
            </View>
          </View>

          {/* 2. SECTION BASSE (PANNEAU DU FORMULAIRE PLEINE LARGEUR ~ 60-65% DE L'ÉCRAN) */}
          <View 
            className="flex-1 w-full bg-white dark:bg-zinc-900 rounded-t-[36px] px-6 pt-7 border-t border-zinc-200/50 dark:border-zinc-800/80 shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom + 24, 32) }}
          >
            {/* Barre de drag visuelle subtile */}
            <View className="w-12 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 self-center mb-6 opacity-60" />

            {/* Header du Formulaire */}
            <View className="mb-6 flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <View className="flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-emerald-500" />
                <Text className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Identification Sécurisée
                </Text>
              </View>
            </View>

            {/* Formulaire Intégré */}
            <LoginForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
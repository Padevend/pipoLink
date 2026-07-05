import { useToast } from '@/providers';
import { authApi } from '@/shared/api/auth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const { showToast } = useToast();
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!password) {
      showToast({ type: 'error', message: 'Veuillez saisir un mot de passe' });
      return;
    }
    if (password.length < 8) {
      showToast({ type: 'error', message: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }
    if (password !== confirmPassword) {
      showToast({ type: 'error', message: 'Les mots de passe ne correspondent pas' });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ email: email!, code: code!, newPassword: password });
      showToast({ type: 'success', message: 'Mot de passe réinitialisé avec succès !' });
      router.replace('/auth/login');
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Échec de la réinitialisation' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>

      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        {/* Bouton Retour Géométrique Mat */}
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>

        {/* Bloc Titre & Sous-titre Contextuel */}
        <View className="ml-3 flex-1">
          <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Nouveau mot de passe
          </Text>
          <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
            Sécurisation du compte
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-4 pt-6 pb-10">

          {/* Section d'accueil textuelle épurée */}
          <View className="mb-6">
            <Text className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Créez vos nouveaux accès
            </Text>
            <Text className="text-xs font-semibold leading-5 text-zinc-400 dark:text-zinc-500 mt-2">
              Choisissez un mot de passe robuste et mémorable pour protéger l'accès à vos données universitaires chiffrées.
            </Text>
          </View>

          {/* Formulaire (Structure Mat Intégrée) */}
          <View className="w-full gap-y-4">
            <Input
              label="Nouveau mot de passe"
              placeholder="Minimum 8 caractères"
              value={password}
              onChangeText={setPassword}
              leftIcon={Lock}
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? EyeOff : Eye}
              onRightIconPress={() => setShowPassword(!showPassword)}
              containerClassName="bg-transparent"
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Répétez le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leftIcon={Lock}
              secureTextEntry={!showPassword}
              containerClassName="bg-transparent"
            />

            <Button
              label="Mettre à jour le mot de passe"
              onPress={() => void handleReset()}
              loading={isLoading}
              className="bg-orange-500 rounded-xl h-11 mt-2"
              rightIcon={!isLoading ? <CheckCircle2 size={14} color="#FFFFFF" /> : undefined}
            />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
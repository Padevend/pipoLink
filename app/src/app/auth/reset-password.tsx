import { useToast } from '@/providers';
import { authApi } from '@/shared/api/auth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
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
            Réinitialisation
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-1">
            Sécurité du compte
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Math.max(insets.bottom + 24, 32),
          paddingLeft: insets.left,
          paddingRight: insets.right
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-6 pb-10">

          <View className="mb-10">
            <Text className="text-4xl font-black tracking-tighter text-zinc-950 dark:text-white leading-[42px]">
              Nouveau{"\n"}mot de passe
            </Text>
            <Text className="text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400 mt-4">
              Choisissez un mot de passe robuste pour protéger l'accès à vos données universitaires chiffrées.
            </Text>
          </View>

          <View className="w-full gap-y-6">
            <Input
              label="Nouveau mot de passe"
              placeholder="Minimum 8 caractères"
              value={password}
              onChangeText={setPassword}
              leftIcon={Lock}
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? EyeOff : Eye}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Répétez le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leftIcon={Lock}
              secureTextEntry={!showPassword}
            />

            <View className="mt-2">
              <Button
                label="Mettre à jour"
                onPress={() => void handleReset()}
                loading={isLoading}
                size="lg"
                rightIcon={!isLoading ? <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={3} /> : undefined}
              />
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
import { useAuth, useToast } from '@/providers';
import { authApi } from '@/shared/api/auth';
import { ApiError } from '@/shared/api/client';
import { BRAND } from '@/shared/config/brand';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { generateUUID } from '@/shared/utils/uuid';
import { router } from 'expo-router';
import { SecureStorageService, SECURE_STORAGE_KEYS } from '@/shared/lib/storage';
import { ArrowLeft, ChevronRight, Eye, EyeOff, Laptop, Link2, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

type LoginMode = 'primary' | 'choose';

export function LoginForm() {
  const { signInWithTokens } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<LoginMode>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Format email invalide';
    if (!password) newErrors.password = 'Mot de passe requis';
    else if (password.length < 6) newErrors.password = 'Mot de passe trop court';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePrimaryLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      let fingerprint = await SecureStorageService.get(SECURE_STORAGE_KEYS.DEVICE_FINGERPRINT);
      if (!fingerprint) {
        fingerprint = generateUUID();
        await SecureStorageService.set(SECURE_STORAGE_KEYS.DEVICE_FINGERPRINT, fingerprint);
      }

      const result = await authApi.login({
        email,
        password,
        loginMode: 'primary',
        deviceFingerprint: fingerprint,
        deviceName: `${Platform.OS} device`,
        devicePlatform: Platform.OS,
      });

      await signInWithTokens(
        {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresAt: typeof result.expiresAt === 'string' ? result.expiresAt : new Date(result.expiresAt).getTime(),
          deviceId: result.deviceId,
        },
        result.user,
      );

      showToast({ type: 'success', message: 'Connexion réussie' });

      if (result.requiresOnboarding || result.requiresKeySetup) {
        router.replace('/auth/onboarding' as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError && e.code === 'DEVICE_NOT_REGISTERED'
          ? 'Utilisez « Associer un appareil » pour cet appareil secondaire.'
          : e instanceof Error
            ? e.message
            : 'Échec de la connexion';
      showToast({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // VUE 1 : CHOIX DU MODE DE CONNEXION (Style Menu Capsulaire Satiné)
  if (mode === 'choose') {
    return (
      <View className="w-full">
        <Text className="mb-5 text-center text-[12px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60">
          Sélectionnez la méthode d'authentification requis par votre équipement :
        </Text>

        {/* Bloc Unique style Verre Flouté pour regrouper les choix */}
        <View className="overflow-hidden rounded-2xl border border-border-light/20 bg-surface-light/40 dark:border-border-dark/10 dark:bg-surface-dark/30 backdrop-blur-md mb-6">
          
          {/* Option A : Appareil Principal */}
          <Pressable
            onPress={() => setMode('primary')}
            className="flex-row items-center justify-between p-4 active:bg-white/5 transition-all"
          >
            <View className="flex-row items-center gap-3.5 flex-1">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/10">
                <Laptop size={16} color={BRAND.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                  Appareil principal
                </Text>
                <Text className="text-[11px] font-medium text-text-secondary-light/50 dark:text-text-secondary-dark/50 mt-0.5">
                  Compte local — email et mot de passe de l'étudiant
                </Text>
              </View>
            </View>
            <ChevronRight size={16} className="text-text-secondary-light/30" />
          </Pressable>

          {/* Séparateur Ultra-Fin interne */}
          <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />

          {/* Option B : Associer un Appareil */}
          <Pressable
            onPress={() => router.push('/auth/link-device' as any)}
            className="flex-row items-center justify-between p-4 active:bg-white/5 transition-all"
          >
            <View className="flex-row items-center gap-3.5 flex-1">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/10">
                <Link2 size={16} color="#14B8A6" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                  Associer cet appareil
                </Text>
                <Text className="text-[11px] font-medium text-text-secondary-light/50 dark:text-text-secondary-dark/50 mt-0.5">
                  Équipement secondaire — Validation via QR ou code
                </Text>
              </View>
            </View>
            <ChevronRight size={16} className="text-text-secondary-light/30" />
          </Pressable>
        </View>

        {/* Pied du formulaire : Inscription alternative */}
        <View className="flex-row justify-center items-center gap-1.5 pt-2">
          <Text className="text-[13px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60">
            Nouveau sur la plateforme ?
          </Text>
          <Pressable onPress={() => router.push('/auth/register')} className="active:opacity-70">
            <Text className="text-[13px] font-bold text-primary" style={{ color: BRAND.primary }}>
              Créer un compte
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="w-full">
      {/* Bouton de retour contextuel fluide */}
      <Pressable 
        onPress={() => setMode('choose')} 
        className="flex-row items-center gap-1.5 mb-5 self-start px-1 py-1 active:opacity-60"
      >
        <ArrowLeft size={14} color={BRAND.primary} />
        <Text className="text-[13px] font-bold text-primary" style={{ color: BRAND.primary }}>
          Modes de connexion
        </Text>
      </Pressable>

      {/* Inputs ré-alignés sur les spécifications du nouveau composant Input */}
      <View className="gap-y-4">
        <Input
          label="Adresse Email"
          placeholder="nom@universite.edu"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          leftIcon={Mail}
          keyboardType="email-address"
          autoCapitalize="none"
          containerClassName="bg-transparent"
        />
        
        <View className="w-full gap-1.5">
          <Input
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            leftIcon={Lock}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? EyeOff : Eye}
            onRightIconPress={() => setShowPassword(!showPassword)}
            containerClassName="bg-transparent"
          />
          <Pressable 
            onPress={() => router.push('/auth/forgot-password')} 
            className="self-end mt-1 px-1 active:opacity-70"
          >
            <Text className="text-[12px] font-bold text-primary/80 dark:text-primary" style={{ color: BRAND.primary }}>
              Mot de passe oublié ?
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Action Finale de Validation */}
      <View className="mt-8">
        <Button
          label="Se connecter"
          onPress={() => void handlePrimaryLogin()}
          loading={isLoading}
          size="xl"
          className="rounded-xl h-12"
        />
      </View>
    </View>
  );
}
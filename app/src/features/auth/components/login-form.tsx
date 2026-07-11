import { useAuth, useToast } from '@/providers';
import { authApi } from '@/shared/api/auth';
import { ApiError } from '@/shared/api/client';
import { SECURE_STORAGE_KEYS, SecureStorageService } from '@/shared/lib/storage';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { generateUUID } from '@/shared/utils/uuid';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, Eye, EyeOff, Laptop, Link2, Lock, Mail, UserPlus } from 'lucide-react-native';
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

      if (result.keyRecoveryMode) {
        await SecureStorageService.set('temp_login_email', email);
        await SecureStorageService.set('temp_login_password', password);
        if (result.keyBackup) {
          await SecureStorageService.set('temp_key_backup', JSON.stringify(result.keyBackup));
        }
        showToast({
          type: 'info',
          message: result.keyRecoveryMode === 'qr_required'
            ? 'Veuillez valider cet appareil depuis votre appareil principal.'
            : 'Configuration sécurisée : veuillez restaurer votre clé de chiffrement.',
        });
        router.replace({
          pathname: '/devices/key-recovery',
          params: { mode: result.keyRecoveryMode === 'qr_required' ? 'qr' : 'password' },
        } as any);
        return;
      }

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

  // VUE 1 : SÉLECTION DU MODE DE CONNEXION (Mat & Linéaire)
  if (mode === 'choose') {
    return (
      <View className="w-full">
        <Text className="mb-4 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
          Sélectionnez la méthode d'authentification requise par votre équipement :
        </Text>

        {/* Bloc Unique Mat et Opaque */}
        <View className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950 mb-5">

          {/* Option A : Appareil Principal */}
          <Pressable
            onPress={() => setMode('primary')}
            className="flex-row items-center justify-between p-4 active:bg-zinc-50 dark:active:bg-zinc-900/50"
          >
            <View className="flex-row items-center gap-3 flex-1">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50">
                <Laptop size={14} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Appareil principal
                </Text>
                <Text className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Compte local — email et mot de passe de l'étudiant
                </Text>
              </View>
            </View>
            <ChevronRight size={14} color="#71717A" />
          </Pressable>

          {/* Séparateur interne pixelisé */}
          <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />

          {/* Option B : Associer un Appareil */}
          <Pressable
            onPress={() => router.push('/auth/link-device' as any)}
            className="flex-row items-center justify-between p-4 active:bg-zinc-50 dark:active:bg-zinc-900/50"
          >
            <View className="flex-row items-center gap-3 flex-1">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-teal-50 border border-teal-200 dark:bg-teal-950/30 dark:border-teal-900/50">
                <Link2 size={14} color="#14B8A6" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Associer cet appareil
                </Text>
                <Text className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Équipement secondaire — Validation via QR ou code
                </Text>
              </View>
            </View>
            <ChevronRight size={14} color="#71717A" />
          </Pressable>
        </View>

        {/* Pied du formulaire : Lien alternatif */}
        <View className="flex flex-col justify-center items-center gap-1.5 pt-2">
          <Text className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            Nouveau sur la plateforme ?
          </Text>
          <Pressable
            onPress={() => router.push('/auth/register')}
            className="flex-1 flex-row w-full py-5 mt-2 items-center justify-center gap-2 border border-orange-500 bg-orange-500 rounded-xl"
          >
            <UserPlus size={15} color="#FFF" strokeWidth={2.5} />
            <Text className="text-[11px] font-bold text-white uppercase tracking-wider">Créer un compte</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // VUE 2 : FORMULAIRE COMPTE LOCAL
  return (
    <View className="w-full">
      {/* Bouton de retour rigide */}
      <Pressable
        onPress={() => setMode('choose')}
        className="flex-row items-center gap-1.5 mb-4 self-start px-1 py-1"
      >
        <ArrowLeft size={12} color="#F97316" />
        <Text className="text-xs font-bold text-orange-500 dark:text-orange-400">
          Modes de connexion
        </Text>
      </Pressable>

      <View className="gap-y-3.5">
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

        <View className="w-full gap-y-1.5">
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
            className="self-end mt-1 px-1"
          >
            <Text className="text-[11px] font-bold text-orange-500 dark:text-orange-400">
              Mot de passe oublié ?
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Validation d'Action */}
      <View className="mt-6">
        <Button
          label="Se connecter"
          onPress={() => void handlePrimaryLogin()}
          loading={isLoading}
          className="bg-orange-500 rounded-xl h-11"
        />
      </View>
    </View>
  );
}
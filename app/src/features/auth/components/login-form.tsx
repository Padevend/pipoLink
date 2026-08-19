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

  // VUE 1 : SÉLECTION DU MODE DE CONNEXION
  if (mode === 'choose') {
    return (
      <View className="w-full">
        <Text className="mb-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Sélectionnez la méthode d'authentification adaptée à votre équipement :
        </Text>

        <View className="gap-y-3">
          {/* Option A : Appareil Principal */}
          <Pressable
            onPress={() => setMode('primary')}
            className="flex-row items-center justify-between p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 dark:bg-zinc-800/40 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800/80 transition-all"
          >
            <View className="flex-row items-center gap-3.5 flex-1">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                <Laptop size={20} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Appareil principal
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Email et mot de passe de votre compte étudiant
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#A1A1AA" />
          </Pressable>

          {/* Option B : Associer un Appareil */}
          <Pressable
            onPress={() => router.push('/auth/link-device' as any)}
            className="flex-row items-center justify-between p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 dark:bg-zinc-800/40 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800/80 transition-all"
          >
            <View className="flex-row items-center gap-3.5 flex-1">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20">
                <Link2 size={20} color="#14B8A6" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Associer cet appareil
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Équipement secondaire (Validation QR / code)
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#A1A1AA" />
          </Pressable>
        </View>

        {/* Séparateur fluide */}
        <View className="flex-row items-center my-5">
          <View className="flex-1 h-[1px] bg-zinc-200/80 dark:bg-zinc-800" />
          <Text className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nouveau venu ?</Text>
          <View className="flex-1 h-[1px] bg-zinc-200/80 dark:bg-zinc-800" />
        </View>

        {/* Bouton d'Inscription */}
        <Pressable
          onPress={() => router.push('/auth/register')}
          className="flex-row items-center justify-center gap-2.5 py-5 px-6 rounded-2xl bg-orange-500 active:opacity-90"
        >
          <UserPlus size={16} className="text-white" color={Platform.OS === 'ios' ? undefined : '#FFF'} strokeWidth={2.5} />
          <Text className="text-xs font-bold text-white dark:text-zinc-900 uppercase tracking-wider">Créer un nouveau compte</Text>
        </Pressable>
      </View>
    );
  }

  // VUE 2 : FORMULAIRE COMPTE LOCAL
  return (
    <View className="w-full">
      {/* Bouton de retour épuré */}
      <Pressable
        onPress={() => setMode('choose')}
        className="flex-row items-center gap-2 mb-4 self-start px-3 py-1.5 rounded-full bg-orange-500/10 dark:bg-orange-500/20 active:opacity-80"
      >
        <ArrowLeft size={14} color="#F97316" />
        <Text className="text-xs font-bold text-orange-600 dark:text-orange-400">
          Changer de méthode
        </Text>
      </Pressable>

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
          containerClassName="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200/80 dark:border-zinc-800"
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
            containerClassName="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200/80 dark:border-zinc-800"
          />
          <Pressable
            onPress={() => router.push('/auth/forgot-password')}
            className="self-end mt-1 px-1"
          >
            <Text className="text-xs font-semibold text-orange-500 dark:text-orange-400">
              Mot de passe oublié ?
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Validation d'Action (Largeur Totale) */}
      <View className="mt-6">
        <Button
          label="Se connecter"
          onPress={() => void handlePrimaryLogin()}
          loading={isLoading}
          className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-2xl h-14"
        />
      </View>
    </View>
  );
}
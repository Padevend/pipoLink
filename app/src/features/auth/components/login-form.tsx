import { useAuth } from '@/providers';
import { authApi } from '@/shared/api/auth';
import { ApiError } from '@/shared/api/client';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { generateUUID } from '@/shared/utils/uuid';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Eye, EyeOff, Link2, Lock, Mail } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type LoginMode = 'primary' | 'choose';

export function LoginForm() {
  const { signInWithTokens } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

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
      let fingerprint = await SecureStore.getItemAsync('device_fingerprint');
      if (!fingerprint) {
        fingerprint = generateUUID();
        await SecureStore.setItemAsync('device_fingerprint', fingerprint);
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
          expiresAt: typeof result.expiresAt === 'number' ? result.expiresAt : new Date(result.expiresAt).getTime(),
          deviceId: result.deviceId,
        },
        result.user,
      );

      showToast({ type: 'success', message: 'Connexion réussie' });

      if (result.requiresOnboarding) {
        router.replace('/auth/onboarding' as any);
      } else if (result.requiresKeySetup) {
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

  if (mode === 'choose') {
    return (
      <View className="w-full gap-4 p-6">
        <Text className="mb-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Comment souhaitez-vous vous connecter ?
        </Text>
        <Button
          label="Appareil principal"
          size="xl"
          className="rounded-2xl h-14"
          onPress={() => setMode('primary')}
        />
        <Text className="text-center text-xs text-slate-400">
          Compte créé sur cet appareil — email et mot de passe
        </Text>
        <Button
          label="Associer cet appareil"
          variant="outline"
          size="xl"
          className="rounded-2xl h-14"
          leftIcon={<Link2 size={20} color="#14B8A6" />}
          onPress={() => router.push('/auth/link-device' as any)}
        />
        <Text className="text-center text-xs text-slate-400">
          Appareil secondaire — QR ou code à valider sur l&apos;appareil principal
        </Text>
        <View className="mt-4 flex-row justify-center gap-2">
          <Text className="text-slate-500">Nouveau ?</Text>
          <Pressable onPress={() => router.push('/auth/register')}>
            <Text className="font-bold text-primary">Créer un compte</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="w-full p-6">
      <Pressable onPress={() => setMode('choose')} className="mb-4">
        <Text className="text-sm font-bold text-primary">← Retour</Text>
      </Pressable>

      <View className="gap-y-5">
        <Input
          label="Email"
          placeholder="nom@universite.edu"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          leftIcon={Mail}
          keyboardType="email-address"
          autoCapitalize="none"
          className="bg-slate-50 dark:bg-slate-800"
        />
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
          className="bg-slate-50 dark:bg-slate-800"
        />
        <Pressable onPress={() => router.push('/auth/forgot-password')} className="self-end">
          <Text className="text-sm font-bold text-primary">Mot de passe oublié ?</Text>
        </Pressable>
      </View>

      <View className="mt-8">
        <Button
          label="Se connecter"
          onPress={() => void handlePrimaryLogin()}
          loading={isLoading}
          size="xl"
          className="rounded-2xl h-14 shadow-lg shadow-primary/30"
        />
      </View>
    </View>
  );
}

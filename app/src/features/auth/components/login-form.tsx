import { signInWithGoogle } from '@/features/auth/lib/google-auth';
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
        router.replace('/auth/onboarding');
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
      if(e instanceof ApiError && e.code == "ACCOUNT_NOT_VERIFIED"){
        router.push('/auth/verify-otp');
      }
      showToast({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const google = await signInWithGoogle();
      const result = await authApi.google(google);
      await signInWithTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken, expiresAt: typeof result.expiresAt === "string" ? new Date(result.expiresAt).getTime() : result.expiresAt, deviceId: result.deviceId }, result.user);
      router.replace(result.requiresOnboarding ? "/auth/onboarding" : "/(tabs)");
    } catch (e: any) {
      showToast({ type: "error", message: e.message || "Échec de la connexion Google" });
    } finally {
      setIsLoading(false);
    }
  };

  // VUE 1 : SÉLECTION DU MODE DE CONNEXION
  if (mode === 'choose') {
    return (
      <View className="w-full">
        <Text className="mb-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Sélectionnez la méthode d'authentification adaptée à votre équipement :
        </Text>

        <View className="gap-y-4">
          {/* Option A : Appareil Principal (Flat UI, gros arrondis) */}
          <Pressable
            onPress={() => setMode('primary')}
            className="flex-row items-center justify-between p-4 rounded-[32px] bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <View className="flex-row items-center gap-4 flex-1">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-[#0A0A0A]">
                <Laptop size={24} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-black tracking-tight text-zinc-950 dark:text-white">
                  Appareil principal
                </Text>
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                  Email et mot de passe de votre compte étudiant
                </Text>
              </View>
            </View>
            <ChevronRight size={24} color="#A1A1AA" className="mr-2" />
          </Pressable>

          {/* Option B : Associer un Appareil */}
          <Pressable
            onPress={() => router.push('/auth/link-device' as any)}
            className="flex-row items-center justify-between p-4 rounded-[32px] bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <View className="flex-row items-center gap-4 flex-1">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-[#0A0A0A]">
                <Link2 size={24} color="#14B8A6" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-black tracking-tight text-zinc-950 dark:text-white">
                  Associer cet appareil
                </Text>
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                  Équipement secondaire (Validation QR / code)
                </Text>
              </View>
            </View>
            <ChevronRight size={24} color="#A1A1AA" className="mr-2" />
          </Pressable>
        </View>

        {/* Séparateur minimaliste */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-[2px] bg-zinc-100 dark:bg-[#1A1A1A]" />
          <Text className="px-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nouveau venu ?</Text>
          <View className="flex-1 h-[2px] bg-zinc-100 dark:bg-[#1A1A1A]" />
        </View>

        {/* Bouton d'Inscription - Style accentué plein */}
        <Pressable
          onPress={() => router.push('/auth/register')}
          className="flex-row items-center justify-center gap-3 h-16 rounded-full bg-zinc-950 dark:bg-white active:opacity-80"
        >
          <UserPlus size={18} color={Platform.OS === 'ios' ? undefined : '#FFF'} className="text-white dark:text-black" strokeWidth={2.5} />
          <Text className="text-sm font-black text-white dark:text-black uppercase tracking-wider">
            Créer un nouveau compte
          </Text>
        </Pressable>
      </View>
    );
  }

  // VUE 2 : FORMULAIRE COMPTE LOCAL
  return (
    <View className="w-full">
      <Pressable
        onPress={() => setMode('choose')}
        className="flex-row items-center gap-2 mb-6 self-start px-5 py-3 rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
      >
        <ArrowLeft size={16} color="#F97316" strokeWidth={3} />
        <Text className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">
          Retour
        </Text>
      </Pressable>

      <View className="gap-y-5">
        <Input
          label="Adresse Email"
          placeholder="nom@universite.edu"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          leftIcon={Mail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View className="w-full gap-y-2">
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
          />
          <Pressable
            onPress={() => router.push('/auth/forgot-password')}
            className="self-end mt-2 px-2"
          >
            <Text className="text-xs font-black text-orange-500">
              Mot de passe oublié ?
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-8">
        <Button
          label="Se connecter"
          onPress={() => void handlePrimaryLogin()}
          loading={isLoading}
          className="bg-orange-500 rounded-full h-16 shadow-none"
          textClassName="text-white font-black uppercase tracking-wider text-sm"
        />
      </View>
      
      {/* <Pressable 
        onPress={() => void handleGoogleLogin()} 
        disabled={isLoading} 
        className="mt-4 h-16 flex-row items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
      >
        <Text className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider">
          Continuer avec Google
        </Text>
      </Pressable> */}
    </View>
  );
}
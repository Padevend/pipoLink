import { useAuth } from '@/providers';
import { authApi } from '@/shared/api/auth';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { generateUUID } from '@/shared/utils/uuid';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Eye, EyeOff, Lock, Mail, QrCode, Smartphone } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function LoginForm() {
  const { signInWithTokens } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password too short';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
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

      showToast({ type: 'success', message: 'Welcome back!' });

      if (result.requiresOnboarding) {
        router.replace('/auth/onboarding' as any);
      } else if (result.requiresKeySetup) {
        router.replace('/devices/add' as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      showToast({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="w-full p-6">
      <View className="gap-y-5">
        <Input
          label="Email Address"
          placeholder="name@university.edu"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          leftIcon={Mail}
          keyboardType="email-address"
          autoCapitalize="none"
          className="bg-slate-50 dark:bg-slate-800"
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          leftIcon={Lock}
          secureTextEntry={!showPassword}
          rightIcon={showPassword ? EyeOff : Eye}
          onRightIconPress={() => setShowPassword(!showPassword)}
          className="bg-slate-50 dark:bg-slate-800 border-0"
        />

        <Pressable
          onPress={() => router.push('/auth/forgot-password')}
          className="self-end"
        >
          <Text className="text-sm font-bold text-primary">
            Forgot Password?
          </Text>
        </Pressable>
      </View>

      <View className="mt-8 gap-y-6">
        <Button
          label="Sign In"
          onPress={handleLogin}
          loading={isLoading}
          size="xl"
          className="rounded-2xl h-14 shadow-lg shadow-primary/30"
        />

        <View className="flex-row justify-center items-center gap-x-2">
          <Text className="text-slate-500 dark:text-slate-400 font-medium">
            New here?
          </Text>
          <Pressable onPress={() => router.push('/auth/register')}>
            <Text className="font-bold text-primary">Create Account</Text>
          </Pressable>
        </View>

        <View className="gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
          <Text className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            Appareils liés
          </Text>
          <Button
            label="Configurer comme appareil secondaire"
            variant="outline"
            size="lg"
            leftIcon={<Smartphone size={18} color="#FF7A00" />}
            onPress={() => router.push('/devices/add' as any)}
            className="rounded-2xl"
          />
          <Button
            label="Scanner un QR (appareil principal)"
            variant="ghost"
            size="lg"
            leftIcon={<QrCode size={18} color="#14B8A6" />}
            onPress={() => router.push('/devices/scan' as any)}
            className="rounded-2xl"
          />
        </View>
      </View>
    </View>
  );
}

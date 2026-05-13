import { useAuth } from '@/providers';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function LoginForm() {
  const { login } = useAuth();
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
      await login({ email, password });
      showToast({ type: 'success', message: 'Welcome back!' });
      router.replace('/(tabs)');
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Login failed' });
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
      </View>
    </View>
  );
}
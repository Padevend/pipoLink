import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/providers';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useRouter } from 'expo-router';
import { useToast } from '@/shared/hooks/use-toast';

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
    <View className="w-full gap-6">
      <View className="gap-4">
        <Input
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          leftIcon={Mail}
          keyboardType="email-address"
          autoCapitalize="none"
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
        />
        
        <Pressable 
          onPress={() => router.push('/auth/forgot-password')}
          className="self-end"
        >
          <Text className="text-sm font-semibold text-primary">
            Forgot Password?
          </Text>
        </Pressable>
      </View>

      <Button
        label="Log In"
        onPress={handleLogin}
        loading={isLoading}
        size="xl"
      />
      
      <View className="flex-row justify-center gap-1">
        <Text className="text-text-secondary-light dark:text-text-secondary-dark">
          Don't have an account?
        </Text>
        <Pressable onPress={() => router.push('/auth/register')}>
          <Text className="font-bold text-primary">Sign Up</Text>
        </Pressable>
      </View>
    </View>
  );
}

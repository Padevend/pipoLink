import { useAuth } from '@/providers';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function RegisterForm() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Minimum 8 characters required';
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      await register({ email, password });
      showToast({ type: 'success', message: 'Registration successful! Please verify your email.' });
      router.push({
        pathname: '/auth/verify-otp',
        params: { email, purpose: 'EMAIL_VERIFY' }
      });
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Registration failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="w-full gap-6">
      <View className="gap-6">
        <Input
          label="Email Address"
          placeholder="student@university.edu"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          leftIcon={Mail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <Input
          label="Password"
          placeholder="Create a strong password"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          leftIcon={Lock}
          secureTextEntry={!showPassword}
          rightIcon={showPassword ? EyeOff : Eye}
          onRightIconPress={() => setShowPassword(!showPassword)}
        />

        <Input
          label="Confirm Password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          leftIcon={Lock}
          secureTextEntry={!showPassword}
        />
      </View>

      <Button
        label="Create Account"
        onPress={handleRegister}
        loading={isLoading}
        size="xl"
      />
      
      <View className="flex-row justify-center gap-1">
        <Text className="text-text-secondary-light dark:text-text-secondary-dark">
          Already have an account?
        </Text>
        <Pressable onPress={() => router.push('/auth/login')}>
          <Text className="font-bold text-primary">Log In</Text>
        </Pressable>
      </View>
    </View>
  );
}

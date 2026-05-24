import { prepareDeviceForNewAccount } from '@/features/auth/lib/prepare-new-account-device';
import { useAuth, useToast } from '@/providers';
import { BRAND } from '@/shared/config/brand';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { router } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function RegisterForm() {
  const { register } = useAuth();
  const { showToast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Format email invalide';
    
    if (!password) newErrors.password = 'Mot de passe requis';
    else if (password.length < 8) newErrors.password = 'Minimum 8 caractères requis';
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      await prepareDeviceForNewAccount();
      await register({ email, password });
      showToast({ type: 'success', message: 'Inscription réussie ! Veuillez vérifier votre email.' });
      router.push({
        pathname: '/auth/verify-otp',
        params: { email, purpose: 'EMAIL_VERIFY' }
      });
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || "Échec de l'inscription" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="w-full">
      {/* Grille de saisie épurée */}
      <View className="gap-y-5">
        <Input
          label="Adresse Email Académique"
          placeholder="nom@universite.edu"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          leftIcon={Mail}
          keyboardType="email-address"
          autoCapitalize="none"
          containerClassName="bg-transparent"
        />
        
        <Input
          label="Mot de passe"
          placeholder="Créez un mot de passe robuste"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          leftIcon={Lock}
          secureTextEntry={!showPassword}
          rightIcon={showPassword ? EyeOff : Eye}
          onRightIconPress={() => setShowPassword(!showPassword)}
          containerClassName="bg-transparent"
        />

        <Input
          label="Confirmation du mot de passe"
          placeholder="Répétez votre mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          leftIcon={Lock}
          secureTextEntry={!showPassword}
          containerClassName="bg-transparent"
        />
      </View>

      {/* Action de soumission principale */}
      <View className="mt-8 mb-5">
        <Button
          label="Créer mon compte"
          onPress={() => void handleRegister()}
          loading={isLoading}
          size="xl"
          className="rounded-xl h-12"
          rightIcon={!isLoading ? <ArrowRight size={16} color="#FFFFFF" /> : undefined}
        />
      </View>
      
      {/* Lien de redirection vers la connexion */}
      <View className="flex-row justify-center items-center gap-1.5 pt-1">
        <Text className="text-[13px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60">
          Vous avez déjà un compte ?
        </Text>
        <Pressable 
          onPress={() => router.push('/auth/login')}
          className="flex-row items-center active:opacity-70"
        >
          <Text className="text-[13px] font-bold text-primary" style={{ color: BRAND.primary }}>
            Se connecter
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
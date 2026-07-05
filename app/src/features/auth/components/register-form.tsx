import { prepareDeviceForNewAccount } from '@/features/auth/lib/prepare-new-account-device';
import { useAuth, useToast } from '@/providers';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { router } from 'expo-router';
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, Square } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

interface PasswordCriterion {
  id: string;
  label: string;
  isValid: boolean;
}

export function RegisterForm() {
  const { register } = useAuth();
  const { showToast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordCriteria = useMemo<PasswordCriterion[]>(() => {
    return [
      {
        id: 'length',
        label: 'Au moins 8 caractères',
        isValid: password.length >= 8
      },
      {
        id: 'uppercase',
        label: 'Une lettre majuscule',
        isValid: /[A-Z]/.test(password)
      },
      {
        id: 'number',
        label: 'Au moins un chiffre',
        isValid: /\d/.test(password)
      },
    ];
  }, [password]);

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
      <View className="gap-y-4">
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

        {/* Bloc d'indicateur des critères de sécurité mat */}
        <View className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/30 gap-y-2.5">
          <Text className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
            Critères requis de sécurité
          </Text>

          {passwordCriteria.map((criterion) => (
            <View key={criterion.id} className="flex-row items-center gap-x-2.5">
              <View className="h-4 w-4 items-center justify-center">
                {criterion.isValid ? (
                  <Check size={12} color="#10B981" strokeWidth={3} />
                ) : (
                  <Square size={10} color="#D4D4D8" strokeWidth={2.5} />
                )}
              </View>
              <Text
                className={`text-xs font-semibold ${criterion.isValid
                    ? 'text-emerald-600 dark:text-emerald-400 line-through'
                    : 'text-zinc-500 dark:text-zinc-400'
                  }`}
              >
                {criterion.label}
              </Text>
            </View>
          ))}
        </View>

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
      <View className="mt-6 mb-4">
        <Button
          label="Créer mon compte"
          onPress={() => void handleRegister()}
          loading={isLoading}
          className="bg-orange-500 rounded-xl h-11"
          rightIcon={!isLoading ? <ArrowRight size={14} color="#FFFFFF" /> : undefined}
        />
      </View>
      
      {/* Lien de redirection vers la connexion */}
      <View className="flex-row justify-center items-center gap-1.5 pt-1">
        <Text className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
          Vous avez déjà un compte ?
        </Text>
        <Pressable onPress={() => router.push('/auth/login')}>
          <Text className="text-xs font-bold text-orange-500 dark:text-orange-400">
            Se connecter
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
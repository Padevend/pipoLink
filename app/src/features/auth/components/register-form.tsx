import { signInWithGoogle } from '@/features/auth/lib/google-auth';
import { authApi } from '@/shared/api/auth';
import { prepareDeviceForNewAccount } from '@/features/auth/lib/prepare-new-account-device';
import { useAuth, useToast } from '@/providers';
import { SecureStorageService } from '@/shared/lib/storage';
import { checkPasswordStrength } from '@/shared/lib/password-strength';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { router } from 'expo-router';
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, ShieldAlert, Square } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

interface PasswordCriterion {
  id: string;
  label: string;
  isValid: boolean;
}

export function RegisterForm() {
  const { register, signInWithTokens } = useAuth();
  const { showToast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strengthResult = useMemo(() => checkPasswordStrength(password), [password]);

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
      {
        id: 'special',
        label: 'Un caractère spécial',
        isValid: /[^A-Za-z0-9]/.test(password)
      }
    ];
  }, [password]);

  const allCompositionValid = passwordCriteria.every((c) => c.isValid);
  const canSubmit = allCompositionValid && strengthResult.isStrong;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Format email invalide';
    
    if (!password) newErrors.password = 'Mot de passe requis';
    else if (password.length < 8) newErrors.password = 'Minimum 8 caractères requis';
    else if (!strengthResult.isStrong) newErrors.password = strengthResult.feedback || 'Mot de passe trop faible';
    
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
      await SecureStorageService.set('temp_login_password', password);
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

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    try {
      const google = await signInWithGoogle();
      await prepareDeviceForNewAccount();
      const result = await authApi.google(google);
      await signInWithTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken, expiresAt: typeof result.expiresAt === "string" ? new Date(result.expiresAt).getTime() : result.expiresAt, deviceId: result.deviceId }, result.user);
      showToast({ type: "success", message: "Compte Google créé avec succès." });
      router.replace(result.requiresOnboarding ? "/auth/onboarding" : "/(tabs)");
    } catch (e: any) {
      showToast({ type: "error", message: e.message || "Échec de la connexion Google" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="w-full">
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
        />

        <View className="p-6 rounded-[32px] bg-zinc-100 dark:bg-[#1A1A1A] gap-y-3 my-2">
          <Text className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
            Critères de sécurité
          </Text>

          {passwordCriteria.map((criterion) => (
            <View key={criterion.id} className="flex-row items-center gap-x-3">
              <View className="h-5 w-5 items-center justify-center">
                {criterion.isValid ? (
                  <Check size={16} color="#10B981" strokeWidth={3} />
                ) : (
                  <Square size={14} color="#A1A1AA" strokeWidth={2.5} />
                )}
              </View>
              <Text
                className={`text-xs font-bold ${criterion.isValid
                    ? 'text-emerald-500 line-through'
                    : 'text-zinc-500 dark:text-zinc-400'
                  }`}
              >
                {criterion.label}
              </Text>
            </View>
          ))}

          {password.length >= 8 && allCompositionValid && !strengthResult.isStrong && (
            <View className="flex-row items-center gap-x-3 mt-2 pt-4 border-t-2 border-zinc-200 dark:border-[#2A2A2A]">
              <View className="h-5 w-5 items-center justify-center">
                <ShieldAlert size={16} color="#F97316" strokeWidth={3} />
              </View>
              <Text className="text-xs font-black text-orange-500 flex-1 uppercase tracking-wider">
                {strengthResult.feedback}
              </Text>
            </View>
          )}
        </View>

        <Input
          label="Confirmation"
          placeholder="Répétez votre mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          leftIcon={Lock}
          secureTextEntry={!showPassword}
        />
      </View>

      <View className="mt-8 gap-y-4">
        <Button
          label="Créer mon compte"
          onPress={() => void handleRegister()}
          loading={isLoading}
          size="lg"
          rightIcon={!isLoading ? <ArrowRight size={16} color="#FFFFFF" strokeWidth={3} /> : undefined}
        />

        {/* <Pressable 
          onPress={() => void handleGoogleRegister()} 
          disabled={isLoading} 
          className="h-16 flex-row items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80"
        >
          <Text className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-wider">
            S'inscrire avec Google
          </Text>
        </Pressable> */}
      </View>
      
      <View className="flex-row justify-center items-center gap-2 mt-8">
        <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Déjà un compte ?
        </Text>
        <Pressable onPress={() => router.push('/auth/login')}>
          <Text className="text-xs font-black text-orange-500 uppercase tracking-widest">
            Se connecter
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
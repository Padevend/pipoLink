import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { ChevronLeft, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { authApi } from '@/shared/api/auth';
import { useToast } from '@/shared/hooks/use-toast';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const { showToast } = useToast();
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!password) {
      showToast({ type: 'error', message: 'Veuillez saisir un mot de passe' });
      return;
    }
    if (password.length < 8) {
      showToast({ type: 'error', message: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }
    if (password !== confirmPassword) {
      showToast({ type: 'error', message: 'Les mots de passe ne correspondent pas' });
      return;
    }
    
    setIsLoading(true);
    try {
      await authApi.resetPassword({ email: email!, code: code!, newPassword: password });
      showToast({ type: 'success', message: 'Mot de passe réinitialisé avec succès !' });
      router.replace('/auth/login');
    } catch (e: any) {
      showToast({ type: 'error', message: e.message || 'Échec de la réinitialisation' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      {/* En-tête Translucide Style Glassmorphism (Sans Shadow - Adaptatif Light/Dark) */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable 
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 border border-border-light/20 dark:bg-background-dark/30 active:scale-95 transition-transform"
        >
          <ChevronLeft size={18} className="text-text-primary-light dark:text-text-primary-dark" />
        </Pressable>
        
        <View className="ml-3.5 flex-1">
          <Text className="text-[16px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Nouveau mot de passe
          </Text>
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light/50 dark:text-text-secondary-dark/50 mt-0.5">
            Sécurisation du compte
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-6 pb-10">
          
          <View className="mb-8">
            <Text className="text-[24px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              Créez vos nouveaux accès
            </Text>
            <Text className="text-[13px] font-medium leading-[20px] text-text-secondary-light/70 dark:text-text-secondary-dark/60 mt-1.5">
              Choisissez un mot de passe robuste et mémorable pour protéger l'accès à vos données universitaires chiffrées.
            </Text>
          </View>

          <View className="w-full gap-y-5">
            <Input 
              label="Nouveau mot de passe"
              placeholder="Minimum 8 caractères"
              value={password}
              onChangeText={setPassword}
              leftIcon={Lock}
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? EyeOff : Eye}
              onRightIconPress={() => setShowPassword(!showPassword)}
              containerClassName="bg-transparent"
            />

            <Input 
              label="Confirmer le mot de passe"
              placeholder="Répétez le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leftIcon={Lock}
              secureTextEntry={!showPassword}
              containerClassName="bg-transparent"
            />

            <Button 
              label="Mettre à jour le mot de passe"
              onPress={() => void handleReset()}
              loading={isLoading}
              size="xl"
              className="rounded-xl h-12 mt-3"
              rightIcon={!isLoading ? <CheckCircle2 size={16} color="#FFFFFF" /> : undefined}
            />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { ChevronLeft, Mail, Send } from 'lucide-react-native';
import { router } from 'expo-router';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { authApi } from '@/shared/api/auth';
import { useToast } from '@/shared/hooks/use-toast';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      showToast({
        type: 'success',
        message: 'Code de réinitialisation envoyé par email.'
      });
      router.push({
        pathname: '/auth/verify-otp',
        params: { email, purpose: 'PASSWORD_RESET' }
      });
    } catch (e: any) {
      showToast({
        type: 'error',
        message: e.message || 'Échec de l\'envoi du code de réinitialisation'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable 
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 border border-border-light/20 dark:bg-background-dark/30 active:scale-95 transition-transform"
        >
          <ChevronLeft size={18} color="#64748B" />
        </Pressable>
        
        <View className="ml-3.5 flex-1">
          <Text className="text-[16px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Mot de passe oublié
          </Text>
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light/50 dark:text-text-secondary-dark/50 mt-0.5">
            Récupération de compte
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
          
          {/* Section textuelle épurée d'introduction */}
          <View className="mb-8">
            <Text className="text-[24px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              Réinitialiser le mot de passe
            </Text>
            <Text className="text-[13px] font-medium leading-[20px] text-text-secondary-light/70 dark:text-text-secondary-dark/60 mt-1.5">
              Saisissez votre adresse email académique. Nous vous ferons parvenir un code de sécurité pour configurer un nouveau mot de passe.
            </Text>
          </View>

          {/* Formulaire enveloppé (Style Satiné / Glassmorphic) */}
          <View className="w-full gap-y-6">
            <Input 
              label="Adresse Email Académique"
              placeholder="nom@universite.edu"
              value={email}
              onChangeText={setEmail}
              leftIcon={Mail}
              keyboardType="email-address"
              autoCapitalize="none"
              containerClassName="bg-transparent"
            />

            <Button 
              label="Envoyer le code"
              onPress={() => void handleReset()}
              loading={isLoading}
              size="xl"
              className="rounded-xl h-12"
              rightIcon={!isLoading ? <Send size={14} color="#FFFFFF" /> : undefined}
            />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
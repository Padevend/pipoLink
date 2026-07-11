import { useToast } from '@/providers';
import { authApi } from '@/shared/api/auth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
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
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        {/* Bouton Retour Géométrique Mat */}
        <Pressable 
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>
        
        {/* Bloc Titre & Sous-titre Contextuel */}
        <View className="ml-3 flex-1">
          <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Mot de passe oublié
          </Text>
          <Text className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
            Récupération de compte
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 16,
          paddingLeft: insets.left,
          paddingRight: insets.right
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-4 pt-6 pb-10">
          
          {/* Section d'accueil textuelle épurée */}
          <View className="mb-6">
            <Text className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Réinitialiser le mot de passe
            </Text>
            <Text className="text-xs font-semibold leading-5 text-zinc-400 dark:text-zinc-500 mt-2">
              Saisissez votre adresse email académique. Nous vous ferons parvenir un code de sécurité pour configurer un nouveau mot de passe.
            </Text>
          </View>

          {/* Formulaire (Structure Mat Intégrée) */}
          <View className="w-full gap-y-4">
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
              className="bg-orange-500 rounded-xl h-11"
              rightIcon={!isLoading ? <Send size={14} color="#FFFFFF" /> : undefined}
            />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
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
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      
      <View className="flex-row items-center px-6 py-4 gap-4">
        <Pressable 
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={20} color="#F97316" strokeWidth={2.5} />
        </Pressable>
        
        <View className="flex-1">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
            Récupération
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-1">
            Mot de passe oublié
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Math.max(insets.bottom + 24, 32),
          paddingLeft: insets.left,
          paddingRight: insets.right
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-6 pb-10">
          
          <View className="mb-10">
            <Text className="text-4xl font-black tracking-tighter text-zinc-950 dark:text-white leading-[42px]">
              Mot de passe{"\n"}oublié ?
            </Text>
            <Text className="text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400 mt-4">
              Saisissez votre adresse email. Nous vous enverrons un code de sécurité pour réinitialiser l'accès à votre compte.
            </Text>
          </View>

          <View className="w-full gap-y-8">
            <Input 
              label="Adresse Email Académique"
              placeholder="nom@universite.edu"
              value={email}
              onChangeText={setEmail}
              leftIcon={Mail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Button 
              label="Envoyer le code"
              onPress={() => void handleReset()}
              loading={isLoading}
              size="lg"
              rightIcon={!isLoading ? <Send size={16} color="#FFFFFF" strokeWidth={3} /> : undefined}
            />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
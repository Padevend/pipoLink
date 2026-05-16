import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { onboardingSchema, type OnboardingFormValues } from '@/features/auth/lib/onboarding-schema';
import { useOnboarding } from '@/features/auth/hooks/use-onboarding';
import { useAuth } from '@/providers';
import { useToast } from '@/shared/hooks/use-toast';
import { BRAND } from '@/shared/config/brand';
import { AppLogo } from '@/shared/ui/app-logo';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { LevelPicker } from '@/shared/ui/level-picker';
import { PhoneInput } from '@/shared/ui/phone-input';

export default function OnboardingScreen(): JSX.Element {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [niveau, setNiveau] = useState<string | undefined>();
  const [filiere, setFiliere] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormValues, string>>>({});
  const onboarding = useOnboarding();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = () => {
    const payload = {
      firstname,
      lastname,
      username: username || undefined,
      phone: phone || undefined,
      niveau: niveau as OnboardingFormValues['niveau'],
      filiere: filiere || undefined,
    };

    const parsed = onboardingSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof OnboardingFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof OnboardingFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      showToast({ type: 'error', message: 'Corrigez les champs du formulaire.' });
      return;
    }

    setErrors({});
    onboarding.mutate(parsed.data, {
      onSuccess: async () => {
        await refreshUser();
        router.replace('/(tabs)');
      },
      onError: (e) => {
        showToast({
          type: 'error',
          message: e instanceof Error ? e.message : 'Échec de la configuration.',
        });
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <LinearGradient colors={[...BRAND.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="px-6 py-6">
        <AppLogo size="md" showWordmark />
        <Text className="mt-3 text-sm text-white/90">Profil et clés de chiffrement sur cet appareil uniquement.</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-5 py-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Input label="Prénom *" value={firstname} onChangeText={setFirstname} error={errors.firstname} containerClassName="mb-4" />
          <Input label="Nom *" value={lastname} onChangeText={setLastname} error={errors.lastname} containerClassName="mb-4" />
          <Input label="Pseudo (optionnel)" value={username} onChangeText={setUsername} error={errors.username} containerClassName="mb-4" autoCapitalize="none" />
          <PhoneInput label="Téléphone (optionnel)" value={phone} onChangeE164={setPhone} error={errors.phone} dialCode='+237' />
          <View className="mb-4 mt-4">
            <LevelPicker label="Niveau (optionnel)" value={niveau} onChange={setNiveau} error={errors.niveau} />
          </View>
          <Input label="Filière (optionnel)" value={filiere} onChangeText={setFiliere} error={errors.filiere} placeholder="Ex. Informatique" containerClassName="mb-8" />
          <Button label="Terminer la configuration" loading={onboarding.isPending} onPress={() => void handleSubmit()} size="xl" className="rounded-2xl" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

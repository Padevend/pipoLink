import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { useOnboarding } from '@/features/auth/hooks/use-onboarding';
import { useAuth } from '@/providers';
import { Button } from '@/shared/ui/button';
import { Header } from '@/shared/ui/header';
import { Input } from '@/shared/ui/input';

export default function OnboardingScreen(): JSX.Element {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [niveau, setNiveau] = useState('');
  const [filiere, setFiliere] = useState('');
  const onboarding = useOnboarding();
  const { refreshUser } = useAuth();

  const handleSubmit = () => {
    if (!firstname.trim() || !lastname.trim()) return;
    onboarding.mutate(
      {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        username: username.trim() || undefined,
        phone: phone.trim() || undefined,
        niveau: niveau.trim() || undefined,
        filiere: filiere.trim() || undefined,
      },
      {
        onSuccess: async () => {
          await refreshUser();
          router.replace('/(tabs)');
        },
      },
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Header title="Configuration du compte" subtitle="Profil et clés de chiffrement sur cet appareil" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 py-6" keyboardShouldPersistTaps="handled">
          <Text className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Les clés de chiffrement sont générées sur cet appareil uniquement. Le serveur ne reçoit que votre clé publique.
          </Text>
          <Input label="Prénom" value={firstname} onChangeText={setFirstname} containerClassName="mb-3" />
          <Input label="Nom" value={lastname} onChangeText={setLastname} containerClassName="mb-3" />
          <Input label="Pseudo (optionnel)" value={username} onChangeText={setUsername} containerClassName="mb-3" />
          <Input label="Téléphone (optionnel)" value={phone} onChangeText={setPhone} containerClassName="mb-3" />
          <Input label="Niveau (optionnel)" value={niveau} onChangeText={setNiveau} containerClassName="mb-3" />
          <Input label="Filière (optionnel)" value={filiere} onChangeText={setFiliere} containerClassName="mb-6" />
          <Button
            label="Terminer la configuration"
            loading={onboarding.isPending}
            onPress={() => void handleSubmit()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/providers';
import { queryClient } from '@/providers/query-provider';
import { userApi } from '@/shared/api/user';
import { patchCurrentUserAvatar } from '@/shared/lib/query-cache';
import { useToast } from '@/shared/hooks/use-toast';
import { AvatarPicker } from '@/shared/ui/avatar-picker';
import { Button } from '@/shared/ui/button';
import { GenderPicker, type GenderId } from '@/shared/ui/gender-picker';
import { Header } from '@/shared/ui/header';
import { Input } from '@/shared/ui/input';
import { LevelPicker } from '@/shared/ui/level-picker';
import { PhoneInput } from '@/shared/ui/phone-input';

export default function ProfileSettingsScreen(): JSX.Element {
  const { t } = useTranslation('common');
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<GenderId | undefined>();
  const [niveau, setNiveau] = useState<string | undefined>();
  const [filiere, setFiliere] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const p = user.profile;
    setFirstname(p?.firstname ?? '');
    setLastname(p?.lastname ?? '');
    setUsername(user.username ?? '');
    setPhone(p?.phone ?? '');
    setGender(p?.gender as GenderId | undefined);
    setNiveau(p?.niveau ?? undefined);
    setFiliere(p?.filiere ?? '');
    setBio(p?.bio ?? '');
    setAvatarUri(p?.avatarUrl ?? null);
    setLoading(false);
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await userApi.updateProfile({
        firstname,
        lastname,
        phone: phone || undefined,
        gender,
        niveau,
        filiere,
        bio,
      });
      if (avatarUri && !avatarUri.startsWith('http')) {
        const { avatarUrl } = await userApi.uploadAvatar(avatarUri);
        patchCurrentUserAvatar(queryClient, avatarUrl);
      }
      await refreshUser();
      showToast({ type: 'success', message: t('success') });
    } catch (e) {
      showToast({ type: 'error', message: e instanceof Error ? e.message : t('error') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" />;

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Header title="Profile" showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="px-4 py-4" keyboardShouldPersistTaps="handled">
          <AvatarPicker uri={avatarUri} onChange={setAvatarUri} />
          <Input label="First name" value={firstname} onChangeText={setFirstname} containerClassName="mb-3" />
          <Input label="Last name" value={lastname} onChangeText={setLastname} containerClassName="mb-3" />
          <Input label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" containerClassName="mb-3" />
          <PhoneInput value={phone} onChangeE164={setPhone} dialCode="+237" />
          <View className="mb-3 mt-3">
            <GenderPicker value={gender} onChange={setGender} />
          </View>
          <LevelPicker value={niveau} onChange={setNiveau} />
          <Input label="Major" value={filiere} onChangeText={setFiliere} containerClassName="mb-3 mt-3" />
          <Input label="Bio" value={bio} onChangeText={setBio} multiline containerClassName="mb-6 min-h-[100px]" />
          <Button label={t('save')} loading={saving} onPress={() => void save()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCreateAnnouncement } from '@/entities/announcement/hooks';
import { useAuth } from '@/providers';
import { Button } from '@/shared/ui/button';
import { Header } from '@/shared/ui/header';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/hooks/use-toast';

export default function NewAnnouncementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const createMutation = useCreateAnnouncement();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const isStaff = user?.role === 'admin' || user?.role === 'staff';

  if (!isStaff) {
    router.replace('/announcements');
    return null;
  }

  const handlePublish = async () => {
    if (!title.trim() || content.trim().length < 10) {
      showToast({ type: 'error', message: 'Titre et contenu (min. 10 caractères) requis.' });
      return;
    }

    try {
      await createMutation.mutateAsync({ title: title.trim(), content: content.trim() });
      showToast({ type: 'success', message: 'Annonce publiée.' });
      router.back();
    } catch (e: unknown) {
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Publication impossible.',
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Header title="Nouvelle annonce" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView className="px-4 py-4" keyboardShouldPersistTaps="handled">
          <Input
            label="Titre"
            placeholder="ex. Examens du semestre"
            value={title}
            onChangeText={setTitle}
            containerClassName="mb-4"
          />
          <Input
            label="Contenu"
            placeholder="Rédigez votre annonce…"
            value={content}
            onChangeText={setContent}
            multiline
            containerClassName="mb-6 min-h-[200px]"
          />
          <Button
            label="Publier l’annonce"
            size="xl"
            loading={createMutation.isPending}
            onPress={() => void handlePublish()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

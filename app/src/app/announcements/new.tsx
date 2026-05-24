import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCreateAnnouncement } from '@/entities/announcement/hooks';
import { useAuth, useToast } from '@/providers';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

export default function NewAnnouncementScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const createMutation = useCreateAnnouncement();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [poster, setPoster] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [imageRatio, setImageRatio] = useState<number>(16 / 9); // Ratio initial par défaut

  const isStaff = user?.role === 'admin' || user?.role === 'staff';

  // Calcul dynamique du ratio réel dès qu'une image est sélectionnée
  useEffect(() => {
    if (poster?.uri) {
      Image.getSize(
        poster.uri,
        (width, height) => {
          if (width && height) {
            setImageRatio(width / height);
          }
        },
        () => { }
      );
    }
  }, [poster?.uri]);

  if (!isStaff) {
    router.replace('/announcements');
    return null;
  }

  const pickPoster = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ type: 'error', message: 'Permission d’accès à la galerie requise.' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!result.canceled) {
      setPoster(result.assets[0]);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || content.trim().length < 10) {
      showToast({ type: 'error', message: 'Titre et contenu (min. 10 caractères) requis.' });
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        poster: poster !== null ? {
          uri: poster.uri,
          name: poster.fileName ?? `upload_${Date.now()}.jpg`,
          mimeType: poster.mimeType ?? 'image/jpeg',
          size: poster.fileSize ?? 0
        } : null,
      });
      showToast({ type: 'success', message: 'Annonce publiée avec succès.' });
      router.back();
    } catch (e: unknown) {
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Publication impossible.',
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>

      {/* HEADER ULTRA-ÉPURÉ SATINÉ */}
      <View className="z-10 flex-row items-center border-b border-border-light/40 bg-surface-light/75 px-4 py-3 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} color="#64748B" />
        </Pressable>

        <View className="flex-1 ml-3">
          <Text className="text-[16px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Nouvelle annonce
          </Text>
          <Text className="text-[10px] font-bold uppercase tracking-wider text-text-secondary-light/40 dark:text-text-secondary-dark/40 mt-0.5">
            Diffusion officielle
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Bouton de Publication */}
          <Button
            label="Publier l’annonce"
            size="xl"
            disabled={title.trim() === '' || content.trim().length < 10 || createMutation.isPending}
            loading={createMutation.isPending}
            onPress={() => void handlePublish()}
            className="rounded-xl h-11 mb-3"
          />

          {/* Saisie du Titre */}
          <Input
            label="Titre de la publication"
            placeholder="ex. Modalités des examens de fin de semestre"
            value={title}
            onChangeText={setTitle}
            containerClassName="mb-5 bg-surface-light/50 dark:bg-surface-dark/40 border-border-light/40 dark:border-border-dark/20"
          />

          {/* Saisie du Contenu */}
          <Input
            label="Corps du message"
            placeholder="Rédigez le contenu complet de votre annonce à destination des étudiants…"
            value={content}
            onChangeText={setContent}
            multiline
            className="mb-6 min-h-[160px] bg-surface-light/50 dark:bg-surface-dark/40 border-border-light/40 dark:border-border-dark/20 text-start align-top p-4 rounded-xl"
          />

          {/* ZONE D'AJOUT DE POSTER ADAPTATIVE (SANS COUPURE) */}
          <View className="my-6">
            <Text className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-widest text-text-secondary-light/40 dark:text-text-secondary-dark/50">
              Affiche / Poster (Optionnel)
            </Text>

            {!poster?.uri ? (
              // État Initial vide
              <Pressable
                onPress={pickPoster}
                className="w-full h-36 rounded-xl border border-dashed border-border-light/60 dark:border-border-dark/40 bg-surface-light/30 dark:bg-surface-dark/20 items-center justify-center gap-y-2 active:scale-[0.99] transition-all"
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-text-secondary-light/5 border border-border-light/10 dark:border-border-dark/10">
                  <ImagePlus size={20} color="#64748B" strokeWidth={2} />
                </View>
                <Text className="text-[12px] font-bold text-text-secondary-light/50 dark:text-text-secondary-dark/50">
                  Ajouter une image d'illustration
                </Text>
              </Pressable>
            ) : (
              // État Rempli avec Préservation Intégrale de l'Image
              <View
                className="w-full rounded-xl overflow-hidden border border-border-light/40 dark:border-border-dark/20 bg-black/5 dark:bg-black/20 relative"
                style={{ aspectRatio: imageRatio }}
              >
                <Image
                  source={{ uri: poster.uri }}
                  className="w-full h-full"
                  resizeMode="contain"
                />

                {/* Bouton d'action destructif translucide en superposition */}
                <View className="absolute top-3 right-3">
                  <Pressable
                    onPress={() => setPoster(null)}
                    hitSlop={6}
                    className="h-8 px-3 rounded-lg bg-red-500/90 border border-red-500/20 flex-row items-center justify-center gap-x-1.5 active:scale-95 transition-transform"
                  >
                    <Trash2 size={12} color="#FFFFFF" strokeWidth={2.5} />
                    <Text className="text-[11px] font-bold text-white uppercase tracking-wider">Retirer</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
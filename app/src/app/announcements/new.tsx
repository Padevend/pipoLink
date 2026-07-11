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
  const [imageRatio, setImageRatio] = useState<number>(16 / 9);

  const isStaff = user?.role === 'admin' || user?.role === 'staff';

  // Ajustement automatique du format de l'image sélectionnée
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

  // Sécurité : Seul le personnel peut créer une annonce
  if (!isStaff) {
    router.replace('/announcements');
    return null;
  }

  const pickPoster = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ type: 'error', message: 'L’accès à vos photos est nécessaire pour ajouter une image.' });
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
      showToast({ type: 'error', message: 'Veuillez renseigner un titre et un contenu d’au moins 10 caractères.' });
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
      showToast({ type: 'success', message: 'Votre annonce a bien été publiée.' });
      router.back();
    } catch (e: unknown) {
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Une erreur est survenue lors de la publication.',
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>

      {/* BARRE SUPÉRIEURE (Claire et sans reflets) */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-4 dark:border-zinc-900 dark:bg-zinc-900">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 active:opacity-70"
        >
          <ArrowLeft size={18} color="#71717A" />
        </Pressable>

        <View className="flex-1 ml-3">
          <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Nouvelle annonce
          </Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Rédiger un message pour l'établissement
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
          {/* Formulaire de saisie du Titre */}
          <View className="mb-4">
            <Input
              label="Titre de l'annonce"
              placeholder="Exemple : Dates des examens du second semestre"
              value={title}
              onChangeText={setTitle}
              containerClassName="bg-white dark:bg-zinc-900"
            />
          </View>

          {/* Formulaire de saisie du Contenu */}
          <View className="mb-6">
            <Input
              label="Texte de l'annonce"
              placeholder="Écrivez ici toutes les informations importantes destinées aux étudiants..."
              value={content}
              onChangeText={setContent}
              multiline
              className="min-h-[140px] text-start align-top bg-white dark:bg-zinc-900 p-2"
            />
          </View>

          {/* ESPACE POUR L'IMAGE ILLUSTRATIVE */}
          <View className="mb-8">
            <Text className="mb-2 ml-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Image d'illustration (optionnel)
            </Text>

            {!poster?.uri ? (
              // Case vide pour ajouter une photo
              <Pressable
                onPress={pickPoster}
                className="w-full h-32 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 items-center justify-center gap-y-2 active:opacity-80"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800">
                  <ImagePlus size={18} color="#71717A" />
                </View>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                  Choisir une image dans votre téléphone
                </Text>
              </Pressable>
            ) : (
              // Aperçu de la photo sélectionnée avec bouton de suppression net
              <View
                className="w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 relative"
                style={{ aspectRatio: imageRatio }}
              >
                <Image
                  source={{ uri: poster.uri }}
                  className="w-full h-full"
                  resizeMode="contain"
                />

                {/* Bouton pour retirer l'image */}
                <View className="absolute top-3 right-3">
                  <Pressable
                    onPress={() => setPoster(null)}
                    hitSlop={8}
                    className="h-8 px-3 rounded-lg bg-red-500 flex-row items-center justify-center gap-x-1.5 active:bg-red-600"
                  >
                    <Trash2 size={12} color="#FFFFFF" strokeWidth={2.5} />
                    <Text className="text-xs font-bold text-white">Supprimer</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* GRAND BOUTON DE VALIDATION ET ENVOI */}
          <Button
            label={createMutation.isPending ? "Publication en cours..." : "Publier l'annonce maintenant"}
            size="xl"
            disabled={title.trim() === '' || content.trim().length < 10 || createMutation.isPending}
            loading={createMutation.isPending}
            onPress={() => void handlePublish()}
            className="rounded-xl h-12 bg-orange-500 active:bg-orange-600"
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
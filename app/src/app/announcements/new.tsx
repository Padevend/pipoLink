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
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top']}>

      {/* HEADER : Néo-banque, Plat, Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>

        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Nouvelle annonce
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Établissement
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Titre */}
          <View className="mb-6">
            <Input
              label="Titre de l'annonce"
              placeholder="Exemple : Dates des examens du second semestre"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Contenu */}
          <View className="mb-6">
            <Input
              label="Texte de l'annonce"
              placeholder="Écrivez ici toutes les informations importantes destinées aux étudiants..."
              value={content}
              onChangeText={setContent}
              multiline
            />
          </View>

          {/* IMAGE ILLUSTRATIVE */}
          <View className="mb-8">
            <Text className="mb-3 text-[11px] font-black uppercase tracking-widest text-zinc-500">
              Image d'illustration (optionnel)
            </Text>

            {!poster?.uri ? (
              <Pressable
                onPress={pickPoster}
                className="w-full h-40 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-[#1A1A1A] bg-zinc-50 dark:bg-[#0A0A0A] items-center justify-center gap-y-3 active:opacity-80"
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A]">
                  <ImagePlus size={20} color="#F97316" strokeWidth={2.5} />
                </View>
                <Text className="text-xs font-bold text-zinc-950 dark:text-white uppercase tracking-wider">
                  Choisir une image
                </Text>
              </Pressable>
            ) : (
              <View
                className="w-full rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-[#1A1A1A] bg-zinc-100 dark:bg-[#1A1A1A] relative"
                style={{ aspectRatio: imageRatio }}
              >
                <Image
                  source={{ uri: poster.uri }}
                  className="w-full h-full"
                  resizeMode="contain"
                />

                <View className="absolute top-4 right-4">
                  <Pressable
                    onPress={() => setPoster(null)}
                    hitSlop={10}
                    className="h-10 px-4 rounded-full bg-red-500 flex-row items-center justify-center gap-2 active:opacity-80"
                  >
                    <Trash2 size={16} color="#FFFFFF" strokeWidth={2.5} />
                    <Text className="text-xs font-black uppercase tracking-widest text-white">Supprimer</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* BOUTON DE VALIDATION (rounded-full) */}
          <Button
            label={createMutation.isPending ? "Publication en cours..." : "Publier l'annonce maintenant"}
            size="lg"
            disabled={title.trim() === '' || content.trim().length < 10 || createMutation.isPending}
            loading={createMutation.isPending}
            onPress={() => void handlePublish()}
            className="rounded-full h-14 bg-orange-500 active:bg-orange-600"
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
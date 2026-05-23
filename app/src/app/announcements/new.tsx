import * as ImagePicker from 'expo-image-picker'; // Assurez-vous d'avoir expo-image-picker installé
import { router } from 'expo-router';
import { ChevronLeft, ImagePlus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCreateAnnouncement } from '@/entities/announcement/hooks';
import { useAuth } from '@/providers';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import * as DocumentPicker from 'expo-document-picker';

export default function NewAnnouncementScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const createMutation = useCreateAnnouncement();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [poster, setPoster] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const isStaff = user?.role === 'admin' || user?.role === 'staff';

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
    });

    if (!result.canceled) {
      setPoster(result.assets[0] as any)
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || content.trim().length < 10) {
      showToast({ type: 'error', message: 'Titre et contenu (min. 10 caractères) requis.' });
      return;
    }

    try {
      // Intégrez posterUri dans votre mutation si votre backend le prend en charge
      await createMutation.mutateAsync({ 
        title: title.trim(), 
        content: content.trim(),
        poster: poster ? {
          uri: poster.uri,
          name: (poster as any).fileName,
          mimeType: poster.mimeType ?? 'application/octet-stream',
          size: (poster as any).fileSize
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
      
      {/* Header Translucide Style Glassmorphism (Sans Shadow) */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable 
          onPress={() => router.back()} 
          className="h-10 w-10 items-center justify-center rounded-full bg-background-light/40 border border-border-light/20 dark:bg-background-dark/30 active:scale-95 transition-transform"
        >
          <ChevronLeft size={22} color="#64748B"/>
        </Pressable>
        
        <View className="flex-1 ml-3">
          <Text className="text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Nouvelle annonce
          </Text>
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light/50 dark:text-text-secondary-dark/50 mt-0.5">
            Diffusion officielle
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Saisie du Titre */}
          <Input
            label="Titre de la publication"
            placeholder="ex. Modalités des examens de fin de semestre"
            value={title}
            onChangeText={setTitle}
            containerClassName="mb-5 bg-surface-light/50 dark:bg-surface-dark/40 border-border-light/40 dark:border-border-dark/20"
          />

          {/* ZONE D'AJOUT DE POSTER (NOUVEAU CHAMP) */}
          <View className="mb-5">
            <Text className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
              Affiche / Poster (Optionnel)
            </Text>

            {!poster || !(poster.uri) ? (
              // État Initial : Zone de dépôt/clic vide
              <Pressable
                onPress={pickPoster}
                className="w-full h-36 rounded-2xl border border-dashed border-border-light/60 dark:border-border-dark/40 bg-surface-light/30 dark:bg-surface-dark/20 items-center justify-center gap-2 active:bg-text-secondary-light/5 dark:active:bg-text-secondary-dark/5 transition-all"
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-text-secondary-light/5 border border-border-light/10">
                  <ImagePlus size={18} color="#64748B" />
                </View>
                <Text className="text-[12px] font-semibold text-text-secondary-light/60 dark:text-text-secondary-dark/60">
                  Ajouter une image d'illustration (16:9)
                </Text>
              </Pressable>
            ) : (
              // État Rempli : Affichage du poster choisi avec bouton de suppression
              <View className="w-full h-44 rounded-2xl overflow-hidden border border-border-light/40 dark:border-border-dark/20 relative">
                <Image source={{ uri: poster.uri }} className="w-full h-full object-cover" />
                
                {/* Overlay de Verre pour l'action de suppression */}
                <View className="absolute top-3 right-3 flex-row gap-2">
                  <Pressable
                    onPress={() => setPoster(null)}
                    className="h-8 px-3 rounded-xl bg-error/90 border border-error/20 flex-row items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Trash2 size={13} color="#FFFFFF" />
                    <Text className="text-[11px] font-bold text-white">Retirer</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Saisie du Contenu */}
          <Input
            label="Corps du message"
            placeholder="Rédigez le contenu complet de votre annonce à destination des étudiants…"
            value={content}
            onChangeText={setContent}
            multiline
            className="mb-6 min-h-[160px] bg-surface-light dark:bg-surface-dark border-border-light/40 dark:border-border-dark/20 text-start align-top p-4 rounded-2xl"
          />

          {/* Bouton de Publication */}
          <Button
            label="Publier l’annonce"
            size="xl"
            loading={createMutation.isPending}
            onPress={() => void handlePublish()}
            className="rounded-xl h-12 mt-5"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
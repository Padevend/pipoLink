import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams } from 'expo-router';
import { CheckCircle2, FileText, Upload, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useSendMessage } from '@/features/messaging/hooks/use-send-message';
import { useToast } from '@/providers';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UploadFileModal() {
  
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const sendMessage = useSendMessage(conversationId ?? '');

  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [caption, setCaption] = useState('');

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      setFile(result.assets[0]);
    }
  };

  const handleSend = async () => {
    if (!file || !conversationId) return;

    try {
      await sendMessage.mutateAsync({
        content: caption.trim(),
        type: 'document',
        file: {
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType ?? 'application/octet-stream',
          size: file.size,
        },
      });
      router.back();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Échec de l’envoi';
      showToast({ type: 'error', message });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top', 'bottom']}>
      
      {/* Header Minimaliste */}
      <View className="flex-row items-center justify-between border-b border-border-light/30 px-6 py-4 dark:border-border-dark/20 backdrop-blur-md">
        <Text className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Envoyer un document
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-light/60 border border-border-light/20 dark:bg-surface-dark/40 dark:border-border-dark/20 active:opacity-80"
        >
          <X size={18} className="text-text-secondary-light dark:text-text-secondary-dark" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">
          
          {/* Zone de Sélection Style "Glassmorphism" Tactile */}
          <Pressable onPress={handlePickFile} disabled={sendMessage.isPending} className="active:opacity-90">
            <Card
              variant="outline"
              className={cn(
                'h-48 items-center justify-center gap-3.5 rounded-3xl border-2 border-dashed transition-colors',
                file 
                  ? 'border-success/40 bg-success/5 dark:bg-success/10' 
                  : 'border-primary/20 bg-surface-light/40 dark:bg-surface-dark/20 backdrop-blur-md',
              )}
            >
              {file ? (
                <View className="items-center px-4">
                  <View className="p-3 rounded-2xl bg-success/10 mb-2">
                    <CheckCircle2 size={32} className="text-success" />
                  </View>
                  <Text className="font-semibold text-center text-success text-[15px]" numberOfLines={1}>
                    Fichier sélectionné
                  </Text>
                </View>
              ) : (
                <View className="items-center px-4">
                  <View className="p-3 rounded-2xl bg-primary/10 mb-2">
                    <Upload size={28} className="text-primary" />
                  </View>
                  <Text className="font-medium text-[15px] text-text-primary-light dark:text-text-primary-dark">
                    Parcourir les fichiers
                  </Text>
                  <Text className="text-xs text-text-secondary-light/60 dark:text-text-secondary-dark/60 mt-1">
                    Tous les formats sont acceptés
                  </Text>
                </View>
              )}
            </Card>
          </Pressable>

          {/* Détails du Fichier Sélectionné (si présent) */}
          {file && (
            <View className="flex-row items-center gap-3.5 rounded-2xl border border-border-light/40 bg-surface-light/50 p-4 dark:border-border-dark/20 dark:bg-surface-dark/30 backdrop-blur-lg ">
              <View className="p-2.5 rounded-xl bg-primary/10">
                <FileText size={20} className="text-primary" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-[14px] text-text-primary-light dark:text-text-primary-dark" numberOfLines={1}>
                  {file.name}
                </Text>
                {file.size != null && (
                  <Text className="text-[11px] font-medium text-text-secondary-light/70 dark:text-text-secondary-dark/70 mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} Mo
                  </Text>
                )}
              </View>
              {/* Option d'annulation rapide */}
              <Pressable onPress={() => setFile(null)} className="p-1 rounded-full bg-text-secondary-light/10 dark:bg-text-secondary-dark/10">
                <X size={14} className="text-text-secondary-light dark:text-text-secondary-dark" />
              </Pressable>
            </View>
          )}

          {/* Champ d'annotation épuré */}
          <View className="mt-2">
            <Input
              label="Message (optionnel)"
              placeholder="Ajouter un commentaire lié à ce document…"
              value={caption}
              onChangeText={setCaption}
              multiline
              containerClassName="rounded-2xl bg-surface-light/30 border-border-light/40 dark:bg-surface-dark/20 dark:border-border-dark/20"
              className="text-[15px] pt-3"
            />
          </View>

          {/* Bouton de Soumission Principal */}
          <View className="mt-4">
            <Button
              label="Envoyer le document"
              size="xl"
              className={cn(
                "rounded-2xl h-14 ",
                (!file || !conversationId) && "opacity-40"
              )}
              onPress={() => void handleSend()}
              loading={sendMessage.isPending}
              disabled={!file || !conversationId}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
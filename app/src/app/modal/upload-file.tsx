import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, FileText, Upload, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSendMessage } from '@/features/messaging/hooks/use-send-message';
import { useToast } from '@/providers';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';

export default function UploadFileModal() {
  const { id: conversationId, isPending, recipientUserId } = useLocalSearchParams<{
    id: string;
    isPending?: string;
    recipientUserId?: string;
  }>();
  const { showToast } = useToast();
  const sendMessage = useSendMessage(conversationId ?? '');
  const insets = useSafeAreaInsets();

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
        isPending: isPending === 'true',
        recipientUserId: recipientUserId || undefined,
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
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center justify-between border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <View className="flex-1 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Envoyer un document
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Partage de fichiers
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <X size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-y-6">
          
          {/* Zone de Sélection (Arrondis 2xl, fond plein) */}
          <Pressable onPress={handlePickFile} disabled={sendMessage.isPending} className="active:opacity-80 transition-opacity">
            <View
              className={cn(
                'h-48 items-center justify-center gap-y-3 rounded-2xl p-6 border-2',
                file 
                  ? 'border-emerald-500/30 bg-emerald-500/10' 
                  : 'border-dashed border-zinc-200 dark:border-[#222222] bg-zinc-100 dark:bg-[#1A1A1A]',
              )}
            >
              {file ? (
                <View className="items-center">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 mb-3">
                    <CheckCircle2 size={24} color="#10B981" strokeWidth={2.5} />
                  </View>
                  <Text className="text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 text-center">
                    Fichier prêt
                  </Text>
                </View>
              ) : (
                <View className="items-center">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#222222] mb-3">
                    <Upload size={20} color="#F97316" strokeWidth={2.5} />
                  </View>
                  <Text className="text-sm font-black tracking-tight text-zinc-950 dark:text-white text-center">
                    Parcourir les fichiers
                  </Text>
                  <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1 text-center">
                    Tous les formats sont acceptés
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* Détails du Fichier Sélectionné */}
          {file && (
            <View className="flex-row items-center gap-x-4 rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] p-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
                <FileText size={18} color="#F97316" strokeWidth={2.5} />
              </View>
              <View className="flex-1 justify-center">
                <Text className="text-xs font-bold text-zinc-950 dark:text-white" numberOfLines={1}>
                  {file.name}
                </Text>
                {file.size != null && (
                  <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} Mo
                  </Text>
                )}
              </View>
              <Pressable 
                onPress={() => setFile(null)} 
                className="h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-[#222222] active:opacity-80"
              >
                <X size={14} color="#A1A1AA" strokeWidth={2.5} />
              </Pressable>
            </View>
          )}

          {/* Champ d'annotation */}
          <View className="gap-y-2">
            <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
              Message (optionnel)
            </Text>
            <Input
              placeholder="Ajouter un commentaire..."
              placeholderTextColor="#A1A1AA"
              value={caption}
              onChangeText={setCaption}
              multiline
              className="text-sm font-bold text-zinc-950 dark:text-white"
            />
          </View>

          {/* Bouton de Soumission (rounded-full) */}
          <View className="mt-2">
            <Button
              label="Envoyer le document"
              size="lg"
              className={cn(
                "rounded-full h-14 bg-orange-500 active:opacity-80 transition-opacity",
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
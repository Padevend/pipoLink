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
  
  const { id: conversationId, isPending, recipientUserId } = useLocalSearchParams<{
    id: string;
    isPending?: string;
    recipientUserId?: string;
  }>();
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
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'bottom', 'left', 'right']}>
      
      {/* Header Épuré */}
      <View className="flex-row items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-900">
        <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Envoyer un document
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <X size={16} color="#71717A" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <View className="gap-5 pb-8">
          
          {/* Zone de Sélection Mate Fine */}
          <Pressable onPress={handlePickFile} disabled={sendMessage.isPending} className="active:opacity-95">
            <Card
              variant="outline"
              className={cn(
                'h-44 items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors',
                file 
                  ? 'border-emerald-500/30 bg-emerald-50/20 dark:border-emerald-500/20 dark:bg-emerald-950/10' 
                  : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40',
              )}
            >
              {file ? (
                <View className="items-center px-4">
                  <View className="p-2.5 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/40 mb-1">
                    <CheckCircle2 size={24} color="#10B981" />
                  </View>
                  <Text className="font-bold text-center text-emerald-600 dark:text-emerald-400 text-sm">
                    Fichier prêt
                  </Text>
                </View>
              ) : (
                <View className="items-center px-4">
                  <View className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 mb-1.5">
                    <Upload size={20} color="#F97316" />
                  </View>
                  <Text className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                    Parcourir les fichiers
                  </Text>
                  <Text className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Tous les formats sont acceptés
                  </Text>
                </View>
              )}
            </Card>
          </Pressable>

          {/* Détails du Fichier Sélectionné */}
          {file && (
            <View className="flex-row items-center gap-3 rounded-xl border border-zinc-100 bg-white p-3.5 dark:border-zinc-900 dark:bg-zinc-900/60">
              <View className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <FileText size={18} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-xs text-zinc-800 dark:text-zinc-200" numberOfLines={1}>
                  {file.name}
                </Text>
                {file.size != null && (
                  <Text className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} Mo
                  </Text>
                )}
              </View>
              <Pressable 
                onPress={() => setFile(null)} 
                className="p-1 rounded-md bg-zinc-50 dark:bg-zinc-800 active:bg-zinc-100"
              >
                <X size={12} color="#A1A1AA" />
              </Pressable>
            </View>
          )}

          {/* Champ d'annotation */}
          <View className="mt-1">
            <Input
              label="Message (optionnel)"
              placeholder="Ajouter un commentaire..."
              value={caption}
              onChangeText={setCaption}
              multiline
              containerClassName="rounded-xl bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800"
              className="text-sm pt-2 text-zinc-900 dark:text-zinc-50"
            />
          </View>

          {/* Bouton de Soumission */}
          <View className="mt-2">
            <Button
              label="Envoyer le document"
              size="xl"
              className={cn(
                "rounded-xl h-12 bg-orange-500 active:bg-orange-600",
                (!file || !conversationId) && "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 opacity-50"
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
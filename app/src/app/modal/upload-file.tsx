import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, FileText, Upload, X } from 'lucide-react-native';

import { useSendMessage } from '@/features/messaging/hooks/use-send-message';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/cn';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UploadFileModal() {
  const router = useRouter();
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
      showToast({ type: 'success', message: 'Document envoyé dans la conversation.' });
      router.back();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Échec de l’envoi';
      showToast({ type: 'error', message });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center justify-between border-b border-border-light px-6 py-4 dark:border-border-dark">
        <Text className="text-xl font-black text-text-primary-light dark:text-text-primary-dark">
          Envoyer un document
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <X size={20} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6 pt-8">
        <View className="gap-6">
          <Pressable onPress={handlePickFile} disabled={sendMessage.isPending}>
            <Card
              variant="outline"
              className={cn(
                'h-44 items-center justify-center gap-4 border-2 border-dashed',
                file ? 'border-success/50 bg-success/5' : 'border-primary/30 bg-primary/5',
              )}
            >
              {file ? (
                <>
                  <CheckCircle2 size={40} color="#22C55E" />
                  <Text className="font-bold text-success">{file.name}</Text>
                </>
              ) : (
                <>
                  <Upload size={40} color="#FF7A00" />
                  <Text className="font-bold text-primary">Choisir un fichier</Text>
                </>
              )}
            </Card>
          </Pressable>

          {file && (
            <View className="flex-row items-center gap-3 rounded-2xl border border-border-light bg-slate-50 p-4 dark:border-border-dark dark:bg-slate-900">
              <FileText size={24} color="#6B7280" />
              <View className="flex-1">
                <Text className="font-bold text-text-primary-light dark:text-text-primary-dark" numberOfLines={1}>
                  {file.name}
                </Text>
                {file.size != null && (
                  <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {(file.size / (1024 * 1024)).toFixed(2)} Mo
                  </Text>
                )}
              </View>
            </View>
          )}

          <Input
            label="Message (optionnel)"
            placeholder="Ajouter un commentaire…"
            value={caption}
            onChangeText={setCaption}
            multiline
          />

          <Button
            label="Envoyer dans le chat"
            size="xl"
            onPress={() => void handleSend()}
            loading={sendMessage.isPending}
            disabled={!file || !conversationId}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

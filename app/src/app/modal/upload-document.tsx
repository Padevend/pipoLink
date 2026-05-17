import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { CheckCircle2, FileText, Upload, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUploadDocument } from '@/entities/document/hooks';
import type { PickedLibraryFile } from '@/shared/api/library';
import type { DocumentType } from '@/shared/api/types';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { AcademicPathPicker, type AcademicPath } from '@/shared/ui/academic-path-picker';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/cn';

const DOC_TYPES: { label: string; value: DocumentType }[] = [
  { label: 'Cours', value: 'COURS' },
  { label: 'TD', value: 'TD' },
  { label: 'TP', value: 'TP' },
  { label: 'CC', value: 'CC' },
  { label: 'Examen', value: 'EXAMEN' },
  { label: 'Résumé', value: 'RESUME' },
];

export default function UploadDocumentModal() {
  const router = useRouter();
  const { showToast } = useToast();
  const uploadMutation = useUploadDocument();

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<PickedLibraryFile | null>(null);
  const [docType, setDocType] = useState<DocumentType>('COURS');
  const [path, setPath] = useState<AcademicPath | null>(null);

  const handlePathChange = useCallback((p: AcademicPath) => {
    setPath(p);
  }, []);

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        size: asset.size,
      });
      if (!title) setTitle(asset.name.replace(/\.[^.]+$/, ''));
    }
  };

  const canSubmit = Boolean(file && title.trim() && path?.filiere && path.niveau && path.ue);

  const handleUpload = async () => {
    if (!file || !title.trim() || !path) return;

    try {
      await uploadMutation.mutateAsync({
        file,
        metadata: {
          title: title.trim(),
          type: docType,
          filiere: path.filiere,
          niveau: path.niveau,
          ue: path.ue,
        },
      });
      showToast({
        type: 'success',
        message: `Document rangé dans ${path.filiere} › ${path.niveau} › ${path.ue}`,
      });
      router.back();
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : 'Échec de l’upload — vérifiez votre connexion.';
      showToast({ type: 'error', message });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center justify-between border-b border-border-light px-6 py-4 dark:border-border-dark">
        <Text className="text-xl font-black text-text-primary-light dark:text-text-primary-dark">
          Publier un document
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <X size={20} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" keyboardShouldPersistTaps="handled">
        <View className="gap-6 pb-10">
          <Pressable onPress={handlePickDocument} disabled={uploadMutation.isPending}>
            <Card
              variant="outline"
              className={cn(
                'h-40 items-center justify-center gap-3 border-2 border-dashed',
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

          <Input
            label="Titre"
            placeholder="ex. Polycopié chapitre 3"
            value={title}
            onChangeText={setTitle}
            leftIcon={FileText}
          />

          <View className="gap-2">
            <Text className="ml-1 text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
              Type de document
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DOC_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setDocType(t.value)}
                  className={cn(
                    'rounded-2xl px-3 py-2',
                    docType === t.value ? 'bg-primary' : 'bg-surface-light dark:bg-surface-dark',
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-bold',
                      docType === t.value ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark',
                    )}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <AcademicPathPicker value={path ?? {}} onChange={handlePathChange} />


          <Button
            label="Publier"
            size="xl"
            onPress={() => void handleUpload()}
            loading={uploadMutation.isPending}
            disabled={!canSubmit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
